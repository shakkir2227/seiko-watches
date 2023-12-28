import nodemailer from "nodemailer"
import Mailgen from "mailgen";

let config = {
    service: "gmail",
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASSWORD,
    }
}

export let tranporter = nodemailer.createTransport(config);

export let Mailgenerator = new Mailgen(
    {
     theme:"default",
     product: {
        name: "SEIKO",
        link: "http://localhost:3000/"
     }   
    }
)



