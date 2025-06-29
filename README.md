# Hearly: Cloud Platform for Audio Transcription and Summarization

<p align="center">
  <img src="https://github.com/user-attachments/assets/27fb3961-78a4-465c-8745-8428aefdefb3" alt="Hearly logo" width="30%" height="30%" />
</p>

## 💡 Overview

**Hearly** is a **cloud-native platform** designed to simplify and automate the transcription and summarization of audio content.  
Developed as part of the *Cloud Systems* course of the Master's Degree in Computer Science at the University of Catania, Hearly transforms unstructured audio into accessible, searchable, and structured information.

With just a few clicks, users can upload audio files in common formats (MP3, WAV, etc.) and receive:

- ✅ **Automatic transcription** powered by **AWS Transcribe**
- 🧠 **Smart summarization** using **OpenAI GPT-4o** via **Azure**

Each user has access to a **personal dashboard** with analytics such as:
- Detected language
- Audio duration
- Upload frequency
- And more...

## 🧩 Architecture & Infrastructure

Hearly supports two deployment modes to fit different scalability needs:

### 🔸 1. AWS EC2-Based Deployment
- Frontend and backend hosted on **Amazon EC2**
- Direct integration with AWS services for processing and storage

### 🔹 2. Kubernetes on Google GKE
- Services are **containerized** and deployed via **Kubernetes**
- Greater **scalability** and **flexibility**
- Still integrated with core AWS services

### 🛠️ Cloud Components

| Service                   | Purpose                                                                 |
|---------------------------|-------------------------------------------------------------------------|
| **Amazon S3**             | Stores audio files, transcriptions, and summaries                      |
| **AWS Transcribe**        | Performs speech-to-text transcription                                   |
| **Azure OpenAI GPT-4o**   | Generates contextual and concise summaries                              |
| **Amazon DynamoDB**       | Stores metadata and user information                                    |
| **AWS Cognito**           | Manages secure user registration and authentication                     |
| **AWS Lambda**            | Serverless functions to automate and orchestrate transcription workflows |
| **Amazon EventBridge / SNS** | Event-driven architecture for triggering Lambda functions           |

#### 🔄 Lambda Functions

Hearly uses two main **AWS Lambda** functions to automate its processing pipeline:

- **`lambda-audio-transcribe`**  
  Triggered **when the user clicks the "Transcribe" button** in the web interface. It starts a transcription job using **AWS Transcribe**.

- **`transcribe-status-updater`**  
  Periodically checks the status of transcription jobs and updates the system when transcriptions are complete.

These functions are available in two variants:
- Using **Amazon EventBridge** (default in the current deployment)
- Using **Amazon SNS** (alternative version also implemented)

## 🔗 Hearly Pipeline

<p align="center">
  <img src="https://github.com/user-attachments/assets/a6afd197-6f09-4356-9fbc-ed594c7ccd26" alt="Hearly Pipeline Architecture" />
</p>

**Processing Flow:**

1. The **user registers** or logs in through a secure flow managed by **AWS Cognito**
2. The authenticated user uploads an audio file via the web app
3. The file is stored in **Amazon S3**
4. When the user presses **"Transcribe"**, the `lambda-audio-transcribe` function is invoked
5. **AWS Transcribe** processes the audio and starts a transcription job
6. **`transcribe-status-updater`** monitors the transcription job status and updates the system
7. Once the transcription is complete, it is summarized using **GPT-4o** on **Azure OpenAI**
8. All results and metadata are saved in **DynamoDB**
9. The user's dashboard displays transcription, summary, and detailed statistics

## 📊 Features for Users

- 🎙️ Upload MP3, WAV, and other common audio formats
- ✍️ Get accurate **transcriptions** in minutes
- 🧾 Receive short, **meaningful summaries**
- 📈 Monitor activity through the dashboard
- 🔐 Register and login securely via **AWS Cognito**

## 📀 Demo
https://github.com/user-attachments/assets/90a3d3a1-1832-4bb2-b262-e900a7619903



## 👥 Authors

<p align="left">
  <a href="https://github.com/ManciSee">
    <img src="https://avatars.githubusercontent.com/u/80248296?v=4" width="60" height="60" style="border-radius: 50%; margin-right: 20px;">
  </a>
  <a href="https://github.com/enrysorb">
    <img src="https://avatars.githubusercontent.com/u/71724073?v=4" width="60" height="60" style="border-radius: 50%;">
  </a>
</p>

## 📘 License

This project is developed for academic purposes and is distributed under the [MIT License](LICENSE).

---

## 🚀 Try it out

> **Note**: Due to infrastructure costs, the platform may not be publicly available at all times.  
> For demo access or more information, feel free to contact the authors.
