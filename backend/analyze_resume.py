from fastapi import UploadFile, File, Form, APIRouter
from PyPDF2 import PdfReader
from wordfreq import word_frequency
from nltk.corpus import stopwords
import nltk
import re

nltk.download('stopwords')

router = APIRouter()

def extract_specific_keywords(text, top_n=10):
    stop_words = set(stopwords.words('english'))
    words = re.findall(r'\b\w+\b', text.lower())

    filtered = [
        word for word in words
        if word not in stop_words and len(word) > 2
    ]

    # Score by frequency: lower frequency = more unique/specific
    scored = [(word, word_frequency(word, 'en')) for word in set(filtered)]
    scored = sorted(scored, key=lambda x: x[1])  # rarest first

    return [word for word, _ in scored[:top_n]]

@router.post("/analyze-resume/")
async def analyze_resume(resume: UploadFile = File(...), job_description: str = Form(...)):
    # Extract resume text
    pdf = PdfReader(resume.file)
    resume_text = "\n".join(
        page.extract_text() for page in pdf.pages if page.extract_text()
    ).lower()

    # Get keywords from job description
    job_keywords = extract_specific_keywords(job_description, top_n=10)

    # Extract words from resume
    resume_words = set(re.findall(r'\b\w+\b', resume_text.lower()))

    matched_keywords = [kw for kw in job_keywords if kw in resume_words]
    missing_keywords = [kw for kw in job_keywords if kw not in resume_words]

    raw_ratio = len(matched_keywords) / len(job_keywords) if job_keywords else 0
    adjusted_score = 50 + 50 * (raw_ratio ** 0.5)
    adjusted_score = round(adjusted_score, 2)

    return {
        "match_score": f"{adjusted_score:.2f}",
        "missing_keywords": missing_keywords,
    }
