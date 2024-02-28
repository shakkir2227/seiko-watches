
# SEIKO-WATCHES (e-commerce project)

This is an ecommerce project build with node.js express.js and MongoDB. 


## About seiko-watches
seiko-watches is an innovative e-commerce platform built with the user in mind.It has harnessed the power of the MVC (Model-View-Controller) architectural pattern to deliver a seamless shopping experience. Here's what sets us apart:

User-Centric Features: We prioritize your security and convenience with features like secure authentication, dynamic product listings, and efficient cart management.

Admin Empowerment: For administrators, we offer intuitive product and category management, coupon customization, and comprehensive sales analytics.

Ongoing Improvement: seiko-watches is committed to continuously enhancing your shopping experience. Expect exciting updates and new features in the future.
## Features
User Authentication: Enjoy secure and hassle-free authentication with email verification and OTP (One-Time Password) login, powered by Nodemailer.

Dynamic Product Listings: Discover a vast array of products, neatly categorized for effortless browsing.

Cart Management: Effortlessly manage your shopping cart and apply exclusive offers and coupons.

Order Management: Keep track of your orders in real-time, and benefit from efficient order status updates.

Coupon Management: Find personalized savings with admin-managed coupons and special offers.

Address Management: Simplify delivery by managing your addresses and setting a default location.

Wallet Payments: Seamlessly manage your wallet and referral transactions.

Secure Cart Functionality: A secure shopping experience where logged-in users can add items without page reloads.

Error Handling: Graceful error handling and secure session management ensure uninterrupted shopping.

User Profile Management: Personalize your account with profile editing.

Admin Empowerment: Admins can easily manage products, categories, offers, coupons, and gain insights through the dashboard.
## Technologies Used
seiko-watches leverages cutting-edge technologies to provide a secure and efficient shopping experience:

Razorpay Payment Gateway: For seamless and secure payments, It has integrated the Razorpay payment gateway. It allows users to make transactions with confidence and is a trusted solution for handling payments.

Nodemailer: Nodemailer powers our OTP (One-Time Password) verification system during login, adding an extra layer of security to your account.


Node.js: seiko-watches is built on Node.js, providing a scalable and efficient  develoIt has more efficient. 

Nginx:  Implemented server hosting solutions for a web application using Nginx as the primary web server.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`PORT`: The port on which ourserver should listen. Example: PORT=3000

`SESSION_SECRET`: This is to enhance app's security. Use a password value in this field

`CORS_ORIGIN`: For preventing unauthorized access to resources on a different origin. Use * for allowing all origin 

------------ Cloudinary --------------

`CLOUDINARY_CLOUD_NAME`: A unique identifier associated with your Cloudinary account 

`CLOUDINARY_API_KEY`: A unique identifier that is used to authenticate and authorize requests made to Cloudinary's API

`CLOUDINARY_API_SECRET`: A sensitive credential that, along with the API key, is used to authenticate and authorize requests made to Cloudinary's API

--------------NodeMailer-------------

`ADMIN_EMAIL`: Used for nodemailer functionality. Go to your mail provider, find the app email and paste here.

`ADMIN_PASSWORD`: Go to your mail provider and find the app password and paste here

--- Payment Gateway Credentials - Razorpay ---
`RAZORPAY_KEY_ID`: 
RAZORPAY_KEY_ID: Your Razorpay API Key ID for payment processing. Example: RAZORPAY_KEY_ID=your-key-id
`RAZORPAY_KEY_SECRET`: 
RAZORPAY_SECRET_KEY: Your Razorpay API Secret Key for payment processing. Example: RAZORPAY_SECRET_KEY=your-secret-key




## Thank You
Thank you for visiting the repository, Happy coding!