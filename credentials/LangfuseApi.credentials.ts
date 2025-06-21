import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LangfuseApi implements ICredentialType {
	name = 'langfuseApi';
	displayName = 'Langfuse API';
	// TODO
	// eslint-disable-next-line n8n-nodes-base/cred-class-field-documentation-url-not-http-url
	documentationUrl = '';
	properties: INodeProperties[] = [
		{
			displayName: 'Secret Key',
			name: 'secretKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'sk-lf-...',
		},
		{
			displayName: 'Public Key',
			name: 'publicKey',
			type: 'string',
			// eslint-disable-next-line n8n-nodes-base/cred-class-field-type-options-password-missing
			typeOptions: {
				password: false
			},
			default: '',
			placeholder: 'pk-lf-...',
		},
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: 'https://cloud.langfuse.com',
			placeholder: 'https://cloud.langfuse.com',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.publicKey}}',
				password: '={{$credentials.secretKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.host}}',
			url: '/api/public/v2/prompts',
		},
	};
}
