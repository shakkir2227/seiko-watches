import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload
            (localFilePath, {
                resource_type: "auto"
            })
        fs.unlinkSync(localFilePath)//remove the file after
        // the file uploaded to cloudinary.

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //if uploading got failed also,
        //removing localfile added by multer.

    }
}

function generateCroppedUrl(publicId, width, height) {
    // Replacing the substring.
    // https://res.cloudinary.com/demo/image/upload/c_fit,h_250,w_250/docs/models.jpg
    let url = publicId.replace("/upload", `/upload/c_fit,h_${height},w_${width}`)
    return url;
}

function generateRoundedImageUrl(publicId) {
    //
    let url = publicId.replace("/upload", `/upload/ar_1.0,c_thumb,g_face,w_0.6,z_0.7/r_max/co_black,e_outline/co_dimgrey,e_shadow,x_30,y_40`)
    return url;
}

function generateCartoonifiedUrl (publicId){
    let url = publicId.replace("/upload", `/upload/e_cartoonify/a_10/e_brightness:20`)
    return url;
}

export { uploadOnCloudinary, generateCroppedUrl, generateRoundedImageUrl, generateCartoonifiedUrl }