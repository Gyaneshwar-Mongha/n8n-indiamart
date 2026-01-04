import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

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
			// Node properties which the user gets displayed and
			// can change on the node.
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
				displayName: 'Contact',
				name: 'contact',
				type: 'string',
				default: '',
				placeholder: '+917234231410 or user@email.com',
				description: 'Contact number or email address',
				required: true,
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
				const contact = this.getNodeParameter('contact', itemIndex, '') as string;
				item = items[itemIndex];

				/* ---------------- LOGIN API ---------------- */
				const loginResponse = await this.helpers.httpRequest({
					method: 'GET',
					url: 'https://dir.indiamart.com/api/fdbklogin',
					qs: {
						username: contact,
						modid: 'DIR',
						glusr_usr_countryname: 'India',
						screen_name: 'BL/Enq Forms',
						create_user: 1,
						format: 'JSON',
						iso: 'IN',
					},
					headers: {
						'User-Agent': 'n8n-nodes-indiamart',
						Accept: 'application/json',
					},
				});

				if (!loginResponse || loginResponse.code !== 200) {
					throw new NodeOperationError(this.getNode(), 'IndiaMART login failed', {
						itemIndex,
					});
				}

				/* ---------------- EXTRACT glid ---------------- */
				const rfq_sender_id = loginResponse.DataCookie?.glid;

				if (!rfq_sender_id) {
					throw new NodeOperationError(this.getNode(), 'glid not found in login response', {
						itemIndex,
					});
				}

				const mcatInfo = await this.helpers.httpRequest({
					method: 'GET',
					url: 'https://apps.imimg.com/models/mcatid-suggestion.php',
					qs: {
						search_param: 'bags',
					},
					headers: {
						'User-Agent': 'n8n-nodes-indiamart',
						Accept: 'application/json',
					},
				});
				if (!mcatInfo?.mcatid || !mcatInfo?.catid) {
					throw new NodeOperationError(this.getNode(), 'Invalid MCAT response from IndiaMART', {
						itemIndex,
					});
				}

				const mcatid = String(mcatInfo.mcatid);
				const catid = String(mcatInfo.catid);

				/* ---------------- POST REQUIREMENT ---------------- */
				const postResponse = await this.helpers.httpRequest({
					method: 'POST',
					url: 'https://export.indiamart.com/api/saveEnrichment/',
					body: {
						category_type: 'P',
						curr_page_url: '',
						glcat_mcat_id: mcatid,
						iso: 'IN',
						modref_type: 'product',
						prod_serv: 'P',
						rfq_cat_id: catid,
						rfq_query_ref_text: 'n8n',
						rfq_ref_url: '',
						rfq_sender_id: rfq_sender_id,
						rfq_subject: productName,
					},
					headers: {
						'User-Agent': 'n8n-nodes-indiamart',
					},
				});

				// Check if ofr exists and contains a number value
				const hasValidOfr = postResponse.ofr && !isNaN(Number(postResponse.ofr));

				if (hasValidOfr) {
					// Return success response
					item.json = {};
					item.json.message = 'Successfully posted requirement on IndiaMART';
				} else {
					throw new NodeOperationError(this.getNode(), 'Could not post requirement on IndiaMART', {
						itemIndex,
					});
				}
			} catch (error) {
				// Handle errors appropriately
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
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
