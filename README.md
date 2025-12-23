![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-indiamart

This is an n8n community node that enables seamless integration with IndiaMART for product sourcing and purchasing workflows.
IndiaMART is India's largest B2B marketplace, connecting buyers and suppliers across industries.


[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This package includes the following nodes:

### Search
Search for products on IndiaMART by keyword and retrieve a list of matching product names

### Post Requirement
Post a product requirement on IndiaMART using the saveEnrichment API to generate sourcing requests

## Compatibility

Tested locally against n8n v1.104.2.

## Usage

### IndiaMART Search Node

#### Node Configuration

The IndiaMART Search node requires a single parameter:

**Keyword** (required)
- The search term to query on IndiaMART
- Examples: "school bags", "office supplies", "women's clothing"

#### Output

The node returns an object with:

```json
{
  "products": [
    {
      "name": "Plastic Dancing Cactus Toy",
      "number": "8044562706",
      "companyname": "Shree Lalankrupa Enterprise",
      "image": "http://5.imimg.com/data5/SELLER/Default/2024/3/405052888/TF/TX/ZQ/214979800/dancing-cactus-toy-500x500.jpeg"
    },
    {
      "name": "Multicolor Tk Candy Flower Toy For Kids",
      "number": "8047668613",
      "companyname": "Arora Toys",
      "image": "http://5.imimg.com/data5/SELLER/Default/2025/3/497677672/FU/SX/TI/81433069/whatsapp-image-2025-03-23-at-9-01-54-pm-500x500.jpeg"
    }
  ],
  "keyword": "toys"
}
```

- **products**: Array of product objects with details
  - **name**: Product name
  - **number**: Product number/SKU
  - **companyname**: Company/supplier name
  - **image**: Product image URL
- **keyword**: The search keyword used

### IndiaMART Post Requirement Node

#### Node Configuration

The IndiaMART Post Requirement node requires the following parameters:

**Product Name** (required)
- The name of the product for which you're posting a requirement
- Examples: "Pave Diamond Pendant", "Office Chairs", "Electronics"

**Contact** (required)
- Contact number or email address for the requirement
- Examples: "user@email.com" or "7233191224"

#### Output

The node returns an object with:

```json
{
  "message": "Successfully posted requirement on IndiaMART",
}
```

- **message**: Success or error message

### Using the IndiaMART Nodes

Once installed:

1. **Create a new workflow** or open an existing one
2. **Add IndiaMART nodes**: Search for "IndiaMART" in the node panel and drag nodes into your workflow
3. **Configure parameters**: Enter required parameters for each node
4. **Execute the workflow**: Test your workflow to retrieve results
5. **Use the output**: Connect to other nodes to process, filter, or store the results

### Example Workflows

#### Basic Product Search
```
[Trigger] → [IndiaMART Search] → [Log Output]
```

1. Add an IndiaMART Search node to your workflow
2. Set the Keyword parameter (e.g., "school bags")
3. Execute the workflow
4. View the product names in the output

#### Post Product Requirement
```
[Trigger] → [IndiaMART Post Requirement] → [Log Output]
```

1. Add an IndiaMART Post Requirement node to your workflow
2. Set the Product Name (e.g., "Pave Diamond Pendant")
3. Set your contact information (e.g., "user@email.com")
4. Execute the workflow

#### Combined Search and Post Workflow
```
[Trigger] → [IndiaMART Search] → [Process Results] → [IndiaMART Post Requirement] → [Log Output]
```

1. Search for products using the Search node
2. Process the results to filter products
3. Post a requirement for selected product

## Author

**Gyaneshwar Mongha**
- Email: gyaneshwar.mongha@indiamart.com
- GitHub: [@gyaneshwar](https://github.com/gyaneshwar)

## Resources

* [n8n Documentation](https://docs.n8n.io/)
* [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)
* [IndiaMART Website](https://www.indiamart.com)
* [Community Nodes on npm](https://www.npmjs.com/search?q=keywords:n8n-community-node-package)
