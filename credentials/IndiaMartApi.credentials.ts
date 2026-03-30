import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
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

	// Automatically inject secretKey into request body for httpRequestWithAuthentication
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			body: {
				secretKey: '={{$credentials.secretKey}}',
			},
		},
	};

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
		},
	};
}