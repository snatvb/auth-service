import { EmailService, SendArgs } from '~/email/email.service'

let sentHistory: SendArgs[] = []

export class EmailMockService {
  sendEmail: EmailService['sendEmail'] = async (args) => {
    sentHistory.push(args)
  }
}

export const getSentEmailHistory = () => [...sentHistory]
export const clearSentEmailHistory = () => {
  sentHistory = []
}
