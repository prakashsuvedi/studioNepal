terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "bucket_name" {
  default = "nepalai-studio-media-bucket"
}

resource "aws_s3_bucket" "media_bucket" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_lifecycle_configuration" "media_ttl_policy" {
  bucket = aws_s3_bucket.media_bucket.id

  rule {
    id     = "24-Hour-Asset-Auto-Purge"
    status = "Enabled"

    filter {
      prefix = "renders/"
    }

    expiration {
      days = 1
    }
  }
}
