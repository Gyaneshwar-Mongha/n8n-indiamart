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
		description: 'Post product requirements to IndiaMART',
		icon: 'file:../icon.svg',
		group: ['output'],
		version: 1,
		defaults: { name: 'IndiaMART Post Requirement' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Product Name',
				name: 'productName',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'Smartphone, Laptop',
				description: 'Name of the product to post requirement for',
			},
			{
				displayName: 'Quantity',
				name: 'quantity',
				type: 'string',
				default: '',
				placeholder: '100',
				description: 'Quantity of the product required',
			},
			{
				displayName: 'Unit',
				name: 'unit',
				type: 'string',
				default: '',
				placeholder: 'Pieces, kg, liters',
				description: 'Unit of measurement for the quantity',
			},
			{
				displayName: 'Contact (Mobile / Email)',
				name: 'contact',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g., 9876543210 or user@example.com',
				description: 'Contact information (mobile number or email)',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'John Doe',
				description: 'Your full name',
			},
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				default: '',
				placeholder: 'ABC Pvt Ltd',
				description: 'Name of your company',
			},
			{
				displayName: 'Company Url',
				name: 'companyUrl',
				type: 'string',
				default: '',
				placeholder: 'https://www.example.com',
				description: 'Website of your company',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				placeholder: 'Looking for high-quality products...',
				description: 'Additional details about the requirement',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];

			try {
				let productName = (this.getNodeParameter('productName', itemIndex, '') as string) || '';
				let contact = (this.getNodeParameter('contact', itemIndex, '') as string) ||
					String(item.json.mobile ?? '');
				let name = (this.getNodeParameter('name', itemIndex, '') as string) || '';
				let companyName = (this.getNodeParameter('companyName', itemIndex, '') as string) || '';
				let companyUrl = (this.getNodeParameter('companyUrl', itemIndex, '') as string) || '';
				let description = (this.getNodeParameter('description', itemIndex, '') as string) || '';
				let quantity = (this.getNodeParameter('quantity', itemIndex, '') as string) || '';
				let unit = (this.getNodeParameter('unit', itemIndex, '') as string) || '';
				if(quantity && unit){
					description = ` Quantity: ${quantity} ${unit}.\n` + description;
				}

				if (!productName) {
					throw new NodeOperationError(
						this.getNode(),
						'Product name required',
						{ itemIndex }
					);
				}

				if (!contact) {
					throw new NodeOperationError(
						this.getNode(),
						'Contact (mobile/email) is required',
						{ itemIndex }
					);
				}

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
						iso: '+91',
					},
					headers: {
						'User-Agent': 'n8n-nodes-indiamart',
					},
				});

				const rfq_sender_id = loginResponse?.DataCookie?.glid;
				const sessionKey = loginResponse?.DataCookie?.sessionKey;

				if (!rfq_sender_id) {
					throw new NodeOperationError(this.getNode(), 'glid not found in login', { itemIndex });
				}

				const mcatInfo = await this.helpers.httpRequest({
					method: 'GET',
					url: 'https://apps.imimg.com/models/mcatid-suggestion.php',
					qs: { search_param: productName },
					headers: { 'User-Agent': 'n8n-nodes-indiamart' },
				});

				if (!mcatInfo?.mcatid || !mcatInfo?.catid) {
					throw new NodeOperationError(this.getNode(), 'Invalid MCAT response', { itemIndex });
				}

				await this.helpers.httpRequest({
					method: 'POST',
					url: 'https://export.indiamart.com/api/glusrUpdate/',
					body: {
						SESSION_KEY: sessionKey,
						companyName: companyName,
						s_first_name: name,
						s_glusrid: rfq_sender_id,
						scrnNm: 'N8N',
						url: companyUrl,
					},
					headers: {
						'User-Agent': 'n8n-nodes-indiamart',
						'Content-Type': 'application/json', // Added typically for POST requests
					},
				});

				const postResponse = await this.helpers.httpRequest({
					method: 'POST',
					url: 'https://export.indiamart.com/api/saveEnrichment/',
					body: {
						category_type: 'P',
						glcat_mcat_id: String(mcatInfo.mcatid),
						rfq_cat_id: String(mcatInfo.catid),
						iso: '+91',
						modref_type: 'product',
						prod_serv: 'P',
						rfq_sender_id,
						rfq_subject: productName,
						rfq_query_ref_text: 'n8n',
					},
					headers: {
						'User-Agent': 'n8n-nodes-indiamart',
					},
				});

				if (!postResponse?.ofr || isNaN(Number(postResponse.ofr))) {
					throw new NodeOperationError(this.getNode(), 'Failed to post requirement to IndiaMART', { itemIndex });
				}

				const ofrid = String(postResponse.ofr);

				await this.helpers.httpRequest({
				method: 'POST',
				url: 'https://export.indiamart.com/api/saveEnrichment/',
				body: {
					enrichDesc: description,
					flag: 'BL',
					modid: 'EXPORT',
					ofr_id: ofrid,
					q_dest: 1,
					rfq_sender_id: rfq_sender_id,
					updatevalue: 'updated from n8n',
				},
				headers: {
					'User-Agent': 'n8n-nodes-indiamart',
					'Content-Type': 'application/json',
				},
			});

				item.json.status = 'posted';
				item.json.postedProduct = productName;
				item.json.contactUsed = contact;
				item.json.message = 'Requirement posted successfully';
			} catch (error) {
				if (this.continueOnFail()) {
					item.json.error = error;
				} else {
					throw error;
				}
			}
		}

		return [items];
	}
}