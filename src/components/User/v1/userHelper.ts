import sgMail from '@sendgrid/mail';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

// Sendgrid to send email
export async function sendEmail(email: string, emailToken: string | undefined, otp: string | undefined) {
    try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
        if (emailToken !== undefined) {
            let msg = {
                to: email,
                from: 'shail.gor@smartsensesolutions.com',
                subject: 'Email verification',
                text: 'please verify your account',
                html: `<h1>Account Verification</h1>
                       <p>please click below to verify your account</p>
                       <a href = "http://localhost:3000/user/email-verification/${emailToken}" target="_blank" >click here</a>`,
            };
            // console.log(msg);
            return await sgMail.send(msg);
        } else if (otp !== undefined) {
            let msg = {
                to: email,
                from: 'shail.gor@smartsensesolutions.com',
                subject: 'Forgot Password',
                text: 'Forgot Password',
                html: `<h1>Here is your OTP for Reset your Password valid for 2 min</h1>
                       <h2><strong>${otp}</strong></h2>`,
            };
            // console.log(msg);
            return await sgMail.send(msg);
        }
    } catch (error: any) {
        throw error;
    }
}

export async function jwtToken(uuid: string) {
    let token: any = jwt.sign(
        {
            uuid: uuid,
        },
        process.env.JWT_SECRET_KEY as string,
        {
            expiresIn: '2h',
        }
    );
    return token;
}

export function generateOtp() {
    // let otp = Math.floor(Math.random() * 1000000) + 1000000;
    var digits = '0123456789';
    let otp: string = '';
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    console.log(otp);
    return otp;
}

export function getOrderByfield(search: any, sortOrder: any) {
    let orderBy, sortField;
    let condition: any = [];

    if (search) {
        let filter = search.filter;
        for (let key in filter) {
            const data: any = filter[key];
            // console.log(data);

            switch (key) {
                case 'first_name':
                    orderBy = [['first_name', sortOrder]];
                    sortField = 'first_name';
                    condition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
                case 'last_name':
                    orderBy = [['last_name', sortOrder]];
                    sortField = 'last_name';
                    condition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
                case 'display_name':
                    orderBy = [['display_name', sortOrder]];
                    sortField = 'display_name';
                    condition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
                case 'email':
                    orderBy = [['email', sortOrder]];
                    sortField = 'email';
                    condition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
                case 'phone_number':
                    orderBy = [['phone_number', sortOrder]];
                    sortField = 'phone_number';
                    condition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
            }
        }
    } else {
        orderBy = [['created_at', sortOrder]];
        sortField = 'created_at';
    }
    return { orderBy, sortField, condition };
}
