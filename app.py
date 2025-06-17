from flask import Flask, render_template, request, jsonify, flash, redirect, url_for
import google.generativeai as genai
from PIL import Image
import base64
import io
import os
import logging
from werkzeug.utils import secure_filename
from utils.file_utils import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt,
    pdf_to_image,
    get_image_parts,
    FileProcessingError
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

app = Flask(__name__)
app.secret_key = "supersecretkey"

# Load API key (direct or env variable)
GEMINI_API_KEY = "AIzaSyB2ijlVpMEvbENDTYf4VLkykPuMijPwG04"  # Ideally get from env
if not GEMINI_API_KEY:
    logging.error("Gemini API key not found in environment variables.")
    raise ValueError("Gemini API key not found. Set GEMINI_API_KEY in environment variables.")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# File upload config
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt', '.rtf', '.png', '.jpg', '.jpeg'}

def allowed_file(filename):
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

@app.route('/resume_analyser.html')
def resume_analyser():
    return render_template('resume_analyser.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/roadmaps')
def roadmap():
    return render_template('roadmaps.html')

@app.route('/skill-assessments')
def skill_assessments():
    return render_template('skill_assessments.html')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    response = None
    uploaded_image = None

    # Check if the request is AJAX
    is_ajax = request.headers.get("X-Requested-With") == "XMLHttpRequest"

    try:
        prompt = request.form.get("prompt", "").strip()
        if not prompt:
            error_msg = "Please enter a question or prompt."
            if is_ajax:
                return jsonify({"success": False, "error": error_msg}), 400
            flash(error_msg, "warning")
            return redirect(url_for("resume_analyser"))

        if len(prompt) > 1000:
            error_msg = "Prompt is too long. Please keep it under 1000 characters."
            if is_ajax:
                return jsonify({"success": False, "error": error_msg}), 400
            flash(error_msg, "warning")
            return redirect(url_for("resume_analyser"))

        text = ""
        if 'text' in request.form and request.form['text'].strip():
            text = request.form['text']
            logging.info("Using text input for analysis.")

        elif 'resume' in request.files:
            resume = request.files['resume']
            if not resume or resume.filename == '':
                error_msg = "No file uploaded."
                if is_ajax:
                    return jsonify({"success": False, "error": error_msg}), 400
                flash(error_msg, "error")
                return redirect(url_for("resume_analyser"))

            # Check file size
            resume.seek(0, io.SEEK_END)
            file_size = resume.tell()
            resume.seek(0)
            if file_size == 0:
                error_msg = "Uploaded file is empty."
                if is_ajax:
                    return jsonify({"success": False, "error": error_msg}), 400
                flash(error_msg, "error")
                return redirect(url_for("resume_analyser"))

            if not allowed_file(resume.filename):
                error_msg = f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}."
                if is_ajax:
                    return jsonify({"success": False, "error": error_msg}), 400
                flash(error_msg, "error")
                return redirect(url_for("resume_analyser"))

            filename = secure_filename(resume.filename)
            ext = os.path.splitext(filename)[1].lower()
            logging.info(f"Processing file: {filename}")

            if ext == '.pdf':
                text = extract_text_from_pdf(resume)
                if not text.strip():
                    resume.seek(0)
                    image_buffer = pdf_to_image(resume)
                    if image_buffer:
                        image_part = get_image_parts(image_buffer)
                        response = model.generate_content(
                            contents=[{"role": "user", "parts": [prompt, image_part]}]
                        ).text
                        uploaded_image = base64.b64encode(image_buffer.getvalue()).decode("utf-8")
                    else:
                        error_msg = "Failed to process PDF. Try uploading an image."
                        if is_ajax:
                            return jsonify({"success": False, "error": error_msg}), 400
                        flash(error_msg, "error")
                        return redirect(url_for("resume_analyser"))

            elif ext == '.docx':
                text = extract_text_from_docx(resume)
            elif ext == '.txt':
                text = extract_text_from_txt(resume)
            elif ext == '.rtf':
                try:
                    from striprtf.striprtf import rtf_to_text
                    text = rtf_to_text(resume.read().decode("utf-8", errors="ignore"))
                except Exception as e:
                    raise FileProcessingError(f"Failed to process RTF file: {str(e)}")
            elif ext in {'.png', '.jpg', '.jpeg'}:
                image_part = get_image_parts(resume)
                response = model.generate_content(
                    contents=[{"role": "user", "parts": [prompt, image_part]}]
                ).text
                resume.seek(0)
                uploaded_image = base64.b64encode(resume.read()).decode("utf-8")

            if text.strip() and not response:
                full_prompt = (
                    "You are a professional resume analyst. Analyze the following resume and provide detailed feedback or improvements based on the user's prompt. "
                    "Focus on clarity, specificity, and actionable advice. If applicable, suggest improvements for structure, content, and formatting.\n\n"
                    f"User Prompt: {prompt}\n\n"
                    f"Resume Text:\n{text}"
                )
                response = model.generate_content(full_prompt).text

            if not text.strip() and not response:
                error_msg = "Could not extract text from the file."
                if is_ajax:
                    return jsonify({"success": False, "error": error_msg}), 400
                flash(error_msg, "error")
                return redirect(url_for("resume_analyser"))

        else:
            error_msg = "Please provide either text or a file."
            if is_ajax:
                return jsonify({"success": False, "error": error_msg}), 400
            flash(error_msg, "error")
            return redirect(url_for("resume_analyser"))

        logging.info("Sending request to Gemini API.")
        if not response:
            full_prompt = (
                "You are a professional resume analyst. Analyze the following resume and provide detailed feedback or improvements based on the user's prompt. "
                "Focus on clarity, specificity, and actionable advice. If applicable, suggest improvements for structure, content, and formatting.\n\n"
                f"User Prompt: {prompt}\n\n"
                f"Resume Text:\n{text}"
            )
            response = model.generate_content(full_prompt).text
        logging.info("Received response from Gemini API.")

        if is_ajax:
            return jsonify({
                "success": True,
                "response": response,
                "image": uploaded_image
            })

        return render_template("resume_analyser.html", response=response, uploaded_image=uploaded_image)

    except genai.types.generation_types.BlockedPromptException as e:
        logging.error(f"Gemini API blocked prompt: {str(e)}")
        error_msg = "Prompt was blocked by Gemini API due to content restrictions."
        if is_ajax:
            return jsonify({"success": False, "error": error_msg}), 400
        flash(error_msg, "error")
        return redirect(url_for("resume_analyser"))

    except genai.types.generation_types.StopCandidateException as e:
        logging.error(f"Gemini API stopped generation: {str(e)}")
        error_msg = "Gemini API stopped due to safety concerns."
        if is_ajax:
            return jsonify({"success": False, "error": error_msg}), 400
        flash(error_msg, "error")
        return redirect(url_for("resume_analyser"))

    except FileProcessingError as e:
        logging.error(f"File processing error: {str(e)}")
        if is_ajax:
            return jsonify({"success": False, "error": str(e)}), 400
        flash(str(e), "error")
        return redirect(url_for("resume_analyser"))

    except Exception as e:
        logging.error(f"Error during analysis: {str(e)}")
        error_msg = "An error occurred while processing your request."
        if is_ajax:
            return jsonify({"success": False, "error": error_msg}), 500
        flash(error_msg, "error")
        return redirect(url_for("resume_analyser"))


@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        if not message:
            return jsonify({"success": False, "error": "No message provided."}), 400

        career_context = (
            "You are an AI career advisor, specialized in providing career guidance, resume tips, "
            "interview preparation advice, and professional development suggestions. "
            "Your responses should be helpful, concise, and personalized to the user's needs. "
            f"User's message: {message}"
        )
        response = model.generate_content(career_context).text
        logging.info(f"Chat response generated for message: {message}")
        return jsonify({"success": True, "response": response})

    except genai.types.generation_types.BlockedPromptException as e:
        logging.error(f"Gemini API blocked prompt: {str(e)}")
        return jsonify({"success": False, "error": "Prompt blocked due to content restrictions."}), 400
    except Exception as e:
        logging.error(f"Error during chat: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred while processing your message."}), 500
    
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)