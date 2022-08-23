import nodemailer from "nodemailer"
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { PontifexApiEndpoint } from "../interfaces/services/api-endpoint-service/models/PontifexApiEndpoint";
import { PontifexEnvironment } from "../interfaces/services/environment-service/models/PontifexEnvironment";
import {
    PontifexPermissionRequest
} from "../interfaces/services/permission-request-service/models/PontifexPermissionRequest";
import { PontifexUser } from "../interfaces/services/user-service/models/PontifexUser";

export async function send(email: Mail.Options) {
    const options: SMTPTransport.Options = {
        host: process.env.EMAIL_HOST, // hostname
        secure: false, // use SSL
        port: 25, // port for secure SMTP
        tls: {
            rejectUnauthorized: false
        },
        logger: true
    }
    const transporter = nodemailer.createTransport(options)

    transporter.sendMail(email, (error, info) => {
        if (error) {
            console.error("failed to send mail", error)
        } else {
            console.log("email sent successfully", info.response)
        }

        transporter.close()
    })
}

export async function sendRequestEmails(permissionRequest: PontifexPermissionRequest, requestingUser: PontifexUser, endpointOwners: PontifexUser[], environment: PontifexEnvironment, targetEndpoint: PontifexApiEndpoint) {
    const html = `
            <div>
                <h1>New Pontifex Permission Request</h1>
                <p><b>${environment.name}</b> wants to be able to call <b>${targetEndpoint.name}</b></p>
                <p>Click <a href="localhost:3000/permission-requests/${permissionRequest.id}">here</a> to review and approve/reject</p>
            </div>
        `

    const email: Mail.Options = {
        from: `pontifex-no-reply@${process.env.PONTIFEX_EMAIL_DOMAIN}.com`,
        to: endpointOwners.map(owner => owner.email).join(','),
        cc: requestingUser.email,
        subject: 'New Pontifex Permission Request',
        html
    }

    await send(email)
}

export async function sendRequestStatusUpdateEmails(permissionRequest: PontifexPermissionRequest, requestingUser: PontifexUser, endpointOwners: PontifexUser[], environment: PontifexEnvironment, targetEndpoint: PontifexApiEndpoint) {
    const html = `
            <div>
                <h1>Pontifex Permission Request Status Update</h1>
                <p>The status of the permission request for <b>${environment.name}</b> to be able to call <b>${targetEndpoint.name}</b> has been changed to ${permissionRequest.status}</p>
                <p>Click <a href="localhost:3000/permission-requests/${permissionRequest.id}">here</a> to review</p>
            </div>
        `

    const email: Mail.Options = {
        from: `pontifex-no-reply@${process.env.PONTIFEX_EMAIL_DOMAIN}.com`,
        to: endpointOwners.map(owner => owner.email).join(','),
        cc: requestingUser.email,
        subject: 'Pontifex Permission Request Status Update',
        html
    }

    await send(email)
}