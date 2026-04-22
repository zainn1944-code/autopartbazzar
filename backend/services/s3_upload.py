import uuid

import boto3
from botocore.exceptions import ClientError

from config import get_settings


def upload_product_image(file_content: bytes, content_type: str, filename: str) -> str:
    settings = get_settings()
    if not all(
        [settings.aws_bucket_name, settings.aws_region, settings.aws_access_key_id, settings.aws_secret_access_key]
    ):
        raise RuntimeError("AWS S3 is not fully configured")

    key = f"products/{uuid.uuid4().hex}_{filename}"
    client = boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )
    try:
        client.put_object(
            Bucket=settings.aws_bucket_name,
            Key=key,
            Body=file_content,
            ContentType=content_type or "application/octet-stream",
        )
    except ClientError as e:
        raise RuntimeError("S3 upload failed") from e

    return f"https://{settings.aws_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{key}"
