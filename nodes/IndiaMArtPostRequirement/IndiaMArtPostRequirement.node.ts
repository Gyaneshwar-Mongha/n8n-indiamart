import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

// Helper function to extract JSON from response that might have PHP warnings
function extractJSON(response: any): any {
	// If response is already an object, return it (or its data if it's a full response)
	if (typeof response === 'object' && response !== null) {
		if (response.data) return response.data;
		if (response.body) return response.body;
		return response;
	}

	// If response is a string, try to extract JSON
	if (typeof response === 'string') {
		// Find the first { or [ character (start of JSON)
		const jsonStartIndex = Math.min(
			response.indexOf('{') !== -1 ? response.indexOf('{') : Infinity,
			response.indexOf('[') !== -1 ? response.indexOf('[') : Infinity
		);

		if (jsonStartIndex !== Infinity) {
			const jsonString = response.substring(jsonStartIndex);
			try {
				return JSON.parse(jsonString);
			} catch (e) {
				// If parsing fails, return the original response
				return response;
			}
		}
	}

	return response;
}

export class IndiaMArtPostRequirement implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IndiaMART Post Requirement',
		name: 'indiaMArtPostRequirement',
		icon: 'file:../icon.svg',
		group: ['output'],
		version: 1,
		description: 'Post a product requirement on IndiaMART',
		defaults: {
			name: 'IndiaMART Post Requirement',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Secret Key',
				name: 'secretKey',
				type: 'string',
				default: '',
				placeholder: 'Enter your secret key',
				description: 'Enter your secret key',
				required: true,
			},
			{
				displayName: 'Product Name',
				name: 'productName',
				type: 'string',
				default: '',
				placeholder: 'water purifier, office chair',
				description: 'Product name for the requirement',
				required: true,
			},
			{
				displayName: 'Quantity',
				name: 'quantity',
				type: 'number',
				default: 1,
				placeholder: '10',
				description: 'Quantity required (must be greater than 0)',
				required: true,
				typeOptions: {
					minValue: 1,
				},
			},
			{
				displayName: 'Quantity Unit',
				name: 'quantityUnit',
				type: 'string',
				default: 'Piece',
				placeholder: 'Piece, Kg, Ton, Box',
				description: 'Unit of measurement for the quantity',
				required: true,
			},
			{
				displayName: 'Additional Requirements',
				name: 'additionalRequirements',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: 'Any specific requirements, preferences, or details...',
				description: 'Additional information about your requirement',
				required: false,
			},
			{
				displayName: 'Enable Debug Logging',
				name: 'enableDebug',
				type: 'boolean',
				default: true,
				description: 'Whether to enable detailed debug logging',
			},
		],
	};

	// The function below is responsible for posting a requirement
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;

		// Iterates over all input items and posts requirement to IndiaMART
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const productName = this.getNodeParameter('productName', itemIndex, '') as string;
				const secretKey = this.getNodeParameter('secretKey', itemIndex, '') as string;
				const quantity = this.getNodeParameter('quantity', itemIndex, 1) as number;
				const quantityUnit = this.getNodeParameter('quantityUnit', itemIndex, 'Piece') as string;
				const additionalRequirements = this.getNodeParameter('additionalRequirements', itemIndex, '') as string;
				const enableDebug = this.getNodeParameter('enableDebug', itemIndex, true) as boolean;
				item = items[itemIndex];

				const logs: string[] = [];

				// Helper function to safely stringify data and log
				const log = (message: string, data?: any) => {
					let logMessage = `[${new Date().toISOString()}] ${message}`;
					if (data) {
						try {
							logMessage += `: ${JSON.stringify(data, null, 2)}`;
						} catch (e) {
							// Handle circular structures
							logMessage += `: [Unserializable Data: ${e.message}]`;
						}
					}

					logs.push(logMessage);
				};

				log('=== Starting IndiaMART Post Requirement (Single API) ===');
				log('Inputs', {
					productName,
					secretKey,
					quantity,
					quantityUnit,
					additionalRequirements,
				});

				// Validate quantity (must be greater than 0)
				if (quantity <= 0) {
					throw new NodeOperationError(
						this.getNode(),
						'Quantity must be greater than 0',
						{ itemIndex }
					);
				}

				// Validate quantity unit (alphabets only with spaces)
				if (quantityUnit && !/^[a-zA-Z\s]+$/.test(quantityUnit)) {
					throw new NodeOperationError(
						this.getNode(),
						'Quantity unit must contain only alphabets (a-z, A-Z) and spaces',
						{ itemIndex }
					);
				}
				/* ---------------- SINGLE API POST ---------------- */
				const apiUrl = 'https://export.indiamart.com/cgi/postRequirement.php';
				const payload = {
					productName,
					secretKey,
					quantity,
					quantityUnit,
					additionalRequirements,
				};

				log('Request URL', apiUrl);
				log('Request Payload', payload);

				let response: any;
				try {
					const responseRaw = await this.helpers.httpRequest({
						method: 'POST',
						url: apiUrl,
						body: payload,
						headers: {
							'Content-Type': 'application/json',
						},
						json: true,
					});

					// Use helper to safely parse response if needed (though json:true handles mostly)
					response = extractJSON(responseRaw);

					log('Response Status', 'SUCCESS');
					log('Response Data', response);

				} catch (error) {
					log('Response Status', 'FAILED');
					const errorData = {
						message: error.message,
						statusCode: error.statusCode,
						responseBody: error.response?.body || (typeof error.response === 'string' ? error.response : '[Complex Object]'),
					};
					log('Error Details', errorData);
					throw new NodeOperationError(this.getNode(), `Post Requirement failed: ${error.message}`, {
						itemIndex,
					});
				}

				item.json = {
					success: true,
					message: 'Requirement posted successfully',
					data: response,
				};

				if (enableDebug) {
					item.json.logs = logs;
				}

			} catch (error) {
				if (this.continueOnFail()) {
					items.push({
						json: {
							...this.getInputData(itemIndex)[0].json,
							success: false,
							error: error.message,
						},
						error,
						pairedItem: itemIndex
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}