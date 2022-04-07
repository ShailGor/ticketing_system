import 'dotenv/config';
import AWS from 'aws-sdk';

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new AWS.S3({
    region,
    accessKeyId,
    secretAccessKey,
});

export async function uploadimageToS3(file: any, data: any) {
    const uploadParams = {
        Bucket: bucketName,
        Key: file,
        Body: data,
    } as AWS.S3.Types.PutObjectRequest;

    return s3.putObject(uploadParams).promise();
}

export async function deleteimageToS3(file: any) {
    const deleteParams = {
        Bucket: bucketName as string,
        Key: file,
    } as AWS.S3.Types.DeleteObjectRequest;

    return s3.deleteObject(deleteParams).promise();
}
