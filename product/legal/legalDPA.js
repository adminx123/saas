/**
 * Data Processing Agreement (DPA) Modal System
 * GDPR Article 28 compliant DPA template for B2B clients
 * Defines data processing relationship between INEXASLI and business clients
 */

console.log('[LegalDPA] Script loading...');

// Data Processing Agreement content
const DATA_PROCESSING_AGREEMENT = {
    title: "Data Processing Agreement (DPA)",
    
    preamble: `This Data Processing Agreement ("DPA") forms part of the Terms of Service between INEXASLI ("Data Processor") and the business client ("Data Controller") and governs the processing of personal data in connection with INEXASLI's services.

**Effective Date:** Upon service activation
**GDPR Compliance:** This DPA complies with EU General Data Protection Regulation (GDPR) Article 28
**Applicability:** This DPA applies to Chat Widget and DM Reply Automation services where client acts as Data Controller for end-user data.`,

    sections: [
        {
            title: "1. Definitions",
            content: `**Data Controller:** The business client who determines the purposes and means of processing personal data.

**Data Processor:** INEXASLI, who processes personal data on behalf of the Data Controller.

**Personal Data:** Any information relating to an identified or identifiable natural person collected through INEXASLI services (chat widget visitors, social media users interacting with automated responses).

**Processing:** Any operation performed on personal data, including collection, storage, use, transmission, and deletion.

**Sub-processor:** Third-party service providers engaged by INEXASLI to assist in processing personal data (see Section 5).

**Data Subject:** The individual (end user) whose personal data is being processed.

**Supervisory Authority:** An independent public authority established by an EU Member State to monitor GDPR compliance.`
        },
        {
            title: "2. Scope and Roles",
            content: `**Data Processing Services:**
This DPA applies to the following INEXASLI services:
• Chat Widget Services - Processing of website visitor queries and conversation data
• DM Reply Automation - Processing of social media direct messages and user interactions
• Social Media Automation - Processing of business social media account data (Controller-to-Controller relationship)

**Data Controller Responsibilities:**
- Determine purposes and means of personal data processing
- Ensure lawful basis exists for processing (GDPR Art. 6)
- Provide privacy notices to data subjects (GDPR Art. 13/14)
- Handle data subject rights requests (access, deletion, portability)
- Maintain records of processing activities
- Ensure compliance with applicable data protection laws

**Data Processor Responsibilities (INEXASLI):**
- Process personal data only on documented instructions from Controller
- Implement appropriate technical and organizational security measures
- Assist Controller with data subject rights requests (where feasible)
- Notify Controller of any personal data breaches
- Delete or return personal data upon termination (as instructed)
- Make available information necessary to demonstrate compliance`
        },
        {
            title: "3. Data Processing Instructions",
            content: `**Permitted Processing:**
INEXASLI is authorized to process personal data only for the following purposes:
• Generate AI responses to chat widget queries using xAI API
• Generate automated responses to social media direct messages using xAI API
• Store conversation history for service delivery and quality improvement
• Analyze interaction data to optimize AI response accuracy
• Provide customer support and troubleshooting assistance
• Send SMS notifications to clients for AI knowledge updates (client phone numbers only)
• Process client SMS responses to train AI systems
• Automatically redact personal information (PII) from end user questions before SMS transmission

**Processing Limitations:**
- INEXASLI will not process personal data for any purpose other than those specified above
- INEXASLI will not sell, rent, or otherwise commercialize personal data
- INEXASLI will not use personal data for independent marketing purposes
- INEXASLI will not transfer personal data to third parties except as authorized sub-processors

**Controller Instructions:**
- This DPA and the Terms of Service constitute Controller's complete written instructions for processing
- Any additional or alternative instructions must be agreed in writing
- INEXASLI will inform Controller if instructions violate GDPR or other data protection laws`
        },
        {
            title: "4. Security Measures",
            content: `**Technical Measures (GDPR Art. 32):**
• Encryption in transit: TLS 1.2+ for all data transmissions
• Access controls: Role-based access with multi-factor authentication
• Secure storage: Data stored on Cloudflare R2 with encryption at rest
• API security: OAuth 2.0 for social media platform connections
• Network security: Cloudflare Workers with DDoS protection

**Organizational Measures:**
• Employee training: Data protection and confidentiality training for staff with data access
• Access limitation: Data access restricted to personnel who require it for service delivery
• Confidentiality commitments: All personnel bound by confidentiality obligations
• Security audits: Regular internal security reviews and monitoring
• Incident response: Documented procedures for security incident handling

**Limitations:**
- Data transmitted to xAI API is protected by TLS encryption only (no additional encryption layer)
- Chat conversation history stored without end-to-end encryption (encrypted at rest only)
- INEXASLI does not implement data anonymization or pseudonymization by default

**Security Updates:**
INEXASLI will monitor and update security measures as necessary to maintain appropriate protection against evolving threats and regulatory requirements.`
        },
        {
            title: "5. Sub-processors",
            content: `**Authorized Sub-processors:**
Controller authorizes INEXASLI to engage the following sub-processors:

**1. xAI (X.AI Corp)**
   • Service: AI content generation and natural language processing
   • Data Processed: User queries, conversation history, business context
   • Location: United States
   • Security: TLS encryption, SOC 2 Type II (pending verification)
   • Privacy Policy: https://x.ai/legal/privacy-policy

**2. Cloudflare, Inc.**
   • Service: Cloud infrastructure, Workers (serverless compute), R2 storage
   • Data Processed: All service data (storage and processing)
   • Location: Global network (data centers worldwide)
   • Security: ISO 27001, SOC 2 Type II certified
   • Privacy Policy: https://www.cloudflare.com/privacypolicy/
   • DPA: Available at https://www.cloudflare.com/cloudflare-customer-dpa/

**3. Stripe, Inc.**
   • Service: Payment processing (limited personal data exposure)
   • Data Processed: Payment card information, billing details
   • Location: United States
   • Security: PCI DSS Level 1 certified
   • Privacy Policy: https://stripe.com/privacy

**4. Twilio, Inc.**
   • Service: SMS delivery for AI knowledge update notifications
   • Data Processed: Client phone numbers, SMS message content (training questions/responses)
   • Location: United States
   • Security: SOC 2 Type II certified, GDPR compliant
   • Privacy Policy: https://www.twilio.com/legal/privacy
   • DPA: Available at https://www.twilio.com/legal/data-protection-addendum

**Sub-processor Changes:**
- INEXASLI will provide 30 days' advance notice of any new sub-processors via email
- Controller may object to new sub-processors within 15 days of notice
- If Controller objects, parties will work in good faith to resolve concerns
- If unresolved, Controller may terminate services without penalty

**Sub-processor Obligations:**
INEXASLI ensures all sub-processors are bound by data protection obligations equivalent to those in this DPA, including:
• Processing data only for specified purposes
• Implementing appropriate security measures
• Maintaining confidentiality
• Assisting with data subject rights requests
• Notifying INEXASLI of security breaches`
        },
        {
            title: "6. Data Subject Rights",
            content: `**Controller Obligations:**
Data Controller is primarily responsible for handling all data subject rights requests under GDPR Articles 15-22, including:
• Right of access (Art. 15)
• Right to rectification (Art. 16)
• Right to erasure / "right to be forgotten" (Art. 17)
• Right to restriction of processing (Art. 18)
• Right to data portability (Art. 20)
• Right to object to processing (Art. 21)

**INEXASLI Assistance:**
Upon Controller's written request, INEXASLI will provide reasonable assistance to fulfill data subject rights requests, including:
• Identifying and retrieving personal data of specific data subjects
• Providing data in commonly used, machine-readable format (where feasible)
• Deleting personal data upon instruction
• Restricting processing as directed

**Limitations:**
- INEXASLI is not responsible for responding directly to data subjects
- Assistance provided subject to technical feasibility and reasonable effort
- Controller responsible for verifying data subject identity
- Some data may be retained for legal compliance or dispute resolution

**Response Time:**
INEXASLI will respond to Controller's assistance requests within 10 business days, or inform Controller if additional time is required due to technical complexity.`
        },
        {
            title: "7. Data Breach Notification",
            content: `**Breach Definition:**
A personal data breach means a breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, personal data.

**INEXASLI Obligations:**
Upon becoming aware of a personal data breach affecting Controller's data, INEXASLI will:
1. Notify Controller without undue delay (target: within 48 hours)
2. Provide the following information (to the extent available):
   • Nature of the breach and categories of data affected
   • Approximate number of data subjects and personal data records affected
   • Likely consequences of the breach
   • Measures taken or proposed to address the breach
   • Contact details for further information

**Controller Obligations:**
- Controller is responsible for assessing whether notification to supervisory authorities or data subjects is required under GDPR Article 33/34
- Controller will handle all communications with supervisory authorities and affected data subjects
- INEXASLI will provide reasonable assistance with breach investigation and remediation

**Breach Response:**
INEXASLI will:
• Investigate the cause and scope of the breach
• Take immediate steps to mitigate ongoing risks
• Document the breach and response measures
• Implement measures to prevent similar breaches

**Limitations:**
INEXASLI is not liable for breaches caused by:
• Controller's failure to implement adequate security on their end (e.g., compromised API keys)
• Sub-processor breaches (though INEXASLI will assist with sub-processor breach response)
• Data breaches at social media platforms or third-party services outside INEXASLI's control`
        },
        {
            title: "8. International Data Transfers",
            content: `**Data Processing Locations:**
Personal data may be processed in the following locations:
• United States (xAI servers, Cloudflare data centers, Stripe)
• European Union (Cloudflare data centers - if configured)
• Global (Cloudflare's distributed network)

**Transfer Mechanisms:**
For transfers of personal data from the European Economic Area (EEA) to third countries:

**1. Adequacy Decisions:**
- Data transfers to countries with EU adequacy decisions are permitted

**2. Standard Contractual Clauses (SCCs):**
- Upon Controller's request, INEXASLI will execute EU Standard Contractual Clauses (2021 version)
- SCCs available as separate addendum to this DPA
- Controller responsible for assessing adequacy of data protection in third countries

**3. Supplementary Measures:**
- Encryption in transit (TLS 1.2+)
- Access controls limiting personnel access to data
- Cloudflare infrastructure provides data residency options (configurable per Controller needs)

**Data Residency Requests:**
Enterprise clients may request data residency restrictions (e.g., EU-only processing) subject to:
• Technical feasibility assessment
• Additional fees for specialized infrastructure
• 30-day implementation timeline

**Brexit Considerations:**
For data transfers to/from the United Kingdom, INEXASLI complies with UK GDPR and applicable transfer mechanisms (UK adequacy decision or UK Addendum to SCCs).`
        },
        {
            title: "9. Audit and Compliance",
            content: `**Compliance Demonstration:**
INEXASLI will make available to Controller information necessary to demonstrate compliance with this DPA, including:
• Description of technical and organizational security measures
• Sub-processor list and agreements
• Incident response procedures and breach logs (if applicable)
• Relevant certifications or audit reports (e.g., SOC 2, ISO 27001 from sub-processors)

**Audit Rights:**
Controller has the right to conduct audits or appoint an independent auditor to verify INEXASLI's compliance with this DPA, subject to:
• Reasonable advance notice (minimum 30 days)
• Audits conducted no more than once per year (unless breach or regulatory requirement)
• Audits conducted during business hours with minimal disruption
• Auditor bound by confidentiality obligations
• Controller bears costs of audit

**Remote Audits:**
In most cases, audits will be conducted remotely through:
• Written questionnaires
• Documentation review
• Virtual system demonstrations
• Third-party certifications and audit reports

**On-Site Audits:**
On-site audits may be permitted in limited circumstances (e.g., regulatory investigation, material breach) subject to mutual agreement on scope, timing, and cost allocation.`
        },
        {
            title: "10. Data Retention and Deletion",
            content: `**Retention Periods:**
Personal data will be retained for the following periods:
• Chat conversation history: Duration of service + 90 days
• DM interaction logs: Duration of service + 90 days
• Business account data: Duration of service + 30 days
• Payment/billing records: 7 years (legal compliance requirement)

**Deletion Upon Termination:**
Upon termination of services, INEXASLI will (at Controller's choice):
1. **Delete all personal data** within 30 days of termination, OR
2. **Return personal data** to Controller in commonly used format within 30 days

**Exceptions to Deletion:**
Personal data may be retained beyond termination periods if required for:
• Legal compliance (e.g., tax records, financial audits)
• Establishment, exercise, or defense of legal claims
• Compliance with court orders or regulatory investigations

**Deletion Certification:**
Upon request, INEXASLI will provide written certification that personal data has been deleted or returned, except for data retained under legal exceptions.

**Backup Data:**
Data in backup systems will be deleted in accordance with standard backup rotation schedules (maximum 90 days after deletion from production systems).`
        },
        {
            title: "11. Liability and Indemnification",
            content: `**Liability Allocation (GDPR Art. 82):**
Each party is liable for damages caused by processing that violates their respective obligations under this DPA and GDPR.

**INEXASLI Liability:**
INEXASLI is liable for damages caused by:
• Processing personal data in violation of Controller's documented instructions
• Failure to implement appropriate security measures
• Engaging unauthorized sub-processors
• INEXASLI's failure to comply with GDPR obligations applicable to data processors

**Controller Liability:**
Controller is liable for damages caused by:
• Providing unlawful processing instructions
• Failure to obtain lawful basis for processing
• Failure to provide required privacy notices to data subjects
• Failure to handle data subject rights requests appropriately

**Limitation of Liability:**
Subject to applicable law, INEXASLI's total liability for all claims arising under this DPA is limited to the fees paid by Controller in the 12 months preceding the claim, except for:
• Liability that cannot be limited under applicable law
• Gross negligence or willful misconduct
• Data breach caused by failure to implement required security measures

**AI-Specific Liability Exclusions:**
INEXASLI's liability excludes damages arising from:
• AI-generated content inaccuracies, biases, or inappropriate outputs
• AI system failures, hallucinations, or unexpected behaviors
• Direct harm caused by AI recommendations or automated actions
• Service interruptions due to AI provider outages or technical issues
• Emerging AI risks, new failure modes, or evolving regulatory requirements
• Indirect or consequential damages from AI system limitations

**Indemnification:**
Each party will indemnify the other for fines, penalties, or damages imposed by supervisory authorities resulting from the indemnifying party's violation of its obligations under this DPA or GDPR.`
        },
        {
            title: "12. Term and Termination",
            content: `**Term:**
This DPA takes effect upon service activation and remains in effect for the duration of the Terms of Service.

**Termination:**
This DPA will automatically terminate upon:
• Termination of the Terms of Service
• Completion of all data deletion obligations
• Mutual written agreement to terminate

**Survival:**
The following provisions survive termination:
• Data deletion/return obligations (Section 10)
• Liability provisions (Section 11)
• Confidentiality obligations
• Indemnification obligations

**Effect of Termination:**
Upon termination, INEXASLI will:
• Cease all processing of personal data (except as necessary for deletion/return)
• Delete or return personal data as instructed by Controller
• Ensure sub-processors delete or return personal data
• Provide deletion certification upon request`
        },
        {
            title: "13. General Provisions",
            content: `**Amendments:**
INEXASLI may update this DPA to reflect:
• Changes in data protection laws or regulations
• Guidance from supervisory authorities
• Changes to sub-processors or processing activities
Controller will be notified of material changes 30 days in advance via email.

**Conflict:**
In case of conflict between this DPA and the Terms of Service, this DPA prevails with respect to data protection matters.

**Governing Law:**
This DPA is governed by the same law as the Terms of Service, except where GDPR or other data protection laws mandate different provisions.

**Severability:**
If any provision of this DPA is found unenforceable, the remaining provisions remain in full effect, and parties will negotiate a replacement provision that achieves the intended purpose.

**Entire Agreement:**
This DPA, together with the Terms of Service, constitutes the entire agreement regarding data processing. Any prior agreements or representations regarding data processing are superseded.

**Contact Information:**
For DPA-related inquiries:
• Email: dpo@inexasli.com
• Data Protection Officer: INEXASLI Legal Team
• Response Time: 5 business days for inquiries, 10 business days for assistance requests

**Acceptance:**
By using INEXASLI services, Controller agrees to the terms of this DPA. Enterprise clients requiring signed DPA should contact legal@inexasli.com.`
        }
    ]
};

// CSS styles for the modal
function createDPAModal() {
    const sectionsHtml = generateDPASectionsHtml(DATA_PROCESSING_AGREEMENT.sections);
    
    const htmlContent = `
        <div class="markdown-content" style="text-align: left; font-family: 'Inter', sans-serif; width: 100%; max-height: 70vh; overflow-y: auto;">
            <h2 style="color: #2d5a3d; margin-top: 0; margin-bottom: 16px; font-size: 1.2em; font-family: 'Geist', sans-serif; text-align: center; line-height: 1.2;">${DATA_PROCESSING_AGREEMENT.title}</h2>
            <div style="background: rgba(33, 150, 243, 0.1); border: 2px solid rgba(33, 150, 243, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 0.9em; color: #1976d2; line-height: 1.5;">${DATA_PROCESSING_AGREEMENT.preamble}</div>
            ${sectionsHtml}
            <div style="background: rgba(76, 175, 80, 0.1); border: 2px solid rgba(76, 175, 80, 0.3); border-radius: 8px; padding: 16px; margin-top: 20px; font-size: 0.85em; color: #388e3c;">
                <strong>✓ GDPR Compliant</strong><br>
                This DPA complies with GDPR Article 28 requirements for data processing agreements. Enterprise clients requiring signed DPA or Standard Contractual Clauses should contact legal@inexasli.com.
            </div>
        </div>
    `;

    window.openCustomModal(htmlContent, {
        maxWidth: '600px',
        onOpen: function(modal, modalContent) {
            // Add scroll function to modal context
            window.scrollToDPASection = function(sectionId) {
                const section = modalContent.querySelector(`#${sectionId}`);
                if (section) {
                    section.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }
            };
        }
    });
}

function generateDPASectionsHtml(sections) {
    let sectionsHtml = '';
    sections.forEach((section, index) => {
        sectionsHtml += `
            <div id="dpa-section-${index}" style="margin-bottom: 16px; scroll-margin-top: 20px;">
                <h3 style="color: #2d5a3d; margin: 0 0 8px 0; font-size: 1.05em; font-family: 'Geist', sans-serif;">${section.title}</h3>
                <div style="font-size: 0.9em; line-height: 1.5; color: #333; white-space: pre-line;">${section.content}</div>
            </div>
        `;
    });
    return sectionsHtml;
}

// Show DPA
function showDPA() {
    console.log('[LegalDPA] Opening Data Processing Agreement modal');
    return createDPAModal();
}

/**
 * Public API functions for external access
 */
function openDPAModal() {
    console.log('[LegalDPA] Opening Data Processing Agreement modal');
    return createDPAModal();
}

function openDataProcessingAgreement() {
    return openDPAModal();
}

function showDataProcessingAgreement() {
    return openDPAModal();
}

// Global functions for external access
window.showDPA = showDPA;
window.openDPAModal = openDPAModal;
window.openDataProcessingAgreement = openDataProcessingAgreement;
window.showDataProcessingAgreement = showDataProcessingAgreement;

console.log('[LegalDPA] DPA functions loaded successfully');
