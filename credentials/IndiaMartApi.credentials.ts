import type {
    ICredentialType,
    INodeProperties,
    ICredentialTestRequest,
} from 'n8n-workflow';

export class IndiaMartApi implements ICredentialType {
    name = 'indiaMartApi';
    displayName = 'IndiaMART API';
    documentationUrl = 'https://github.com/Gyaneshwar-Mongha/n8n-indiamart';
    icon = { light: 'file:indiamart.svg', dark: 'file:indiamart.svg' } as const;
    properties: INodeProperties[] = [
        {
            displayName: 'Secret Key',
            name: 'secretKey',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
            description: 'The secret key for IndiaMART API',
        },
    ];

    // Use ICredentialTestRequest type (not a function)
    test: ICredentialTestRequest = {
        request: {
            baseURL: 'https://export.indiamart.com',
            url: '/api/credGenRead/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                secretkey: '={{$credentials.secretKey}}',
            },
            json: true,
            // This is important - tells n8n to return full response
            returnFullResponse: true,
        },
        // This rule checks if response has a glid field (which means success)
        rules: [
            {
                type: 'responseSuccessBody',
                properties: {
                    key: 'glid',
                    message: 'Secret key verified successfully!',
                    value: 'glid',
                },
            },
        ],
    };
}