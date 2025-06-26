##

import os
import boto3
from botocore.exceptions import ClientError

from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential


class ServiceLLM:
    def __init__(self):

        # Azure OpenAI client
        self.client = ChatCompletionsClient(
            endpoint=os.getenv("AZURE_OAI_ENDPOINT"),
            credential=AzureKeyCredential(os.getenv("AZURE_OAI_KEY")),
        )
        self.model_name = "gpt-4o"

        # S3 client
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.summaries_bucket = os.getenv("S3_SUMMARIES_BUCKET")

    def summarize_and_save(self, transcription: str, username: str, file_id: str) -> str:
        """
        Summarize the transcription and save the result to S3.
        """
        assert isinstance(transcription, str)
        assert len(transcription) > 0

        try:
            messages = [
                SystemMessage(content="You are a helpful assistant. Summarize the following transcription."),
                UserMessage(content=transcription),
            ]

            response = self.client.complete(
                messages=messages,
                max_tokens=4096,
                temperature=1.0,
                top_p=1.0,
                model=self.model_name,
            )

            summary = response.choices[0].message.content

            summary_key = f"{username}/{file_id}_summary.txt"
            self.s3_client.put_object(
                Bucket=self.summaries_bucket,
                Key=summary_key,
                Body=summary,
                ContentType="text/plain",
            )

            return summary

        except ClientError as e:
            return "Error generating or saving summary."
        except Exception as e:
            return "Error generating summary."
