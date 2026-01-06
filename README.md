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

### Via npm (Recommended)

1. **Navigate to your n8n custom nodes directory:**
   ```bash
   cd ~/.n8n/nodes
   ```

2. **Install the package:**
   ```bash
   npm install n8n-nodes-indiamart
   ```

3. **Restart n8n:**
   ```bash
   # If running locally
   n8n start
   
   # If running with Docker
   docker restart n8n
   ```

4. **Verify installation:**
   - Open n8n in your browser (http://localhost:5678)
   - Create a new workflow
   - Search for "IndiaMART" in the node panel
   - You should see both nodes available

### Via Git (Development)

For development or contributing:

```bash
# Clone the repository
git clone https://github.com/Gyaneshwar-Mongha/n8n-indiamart.git
cd n8n-indiamart

# Install dependencies
npm install

# Build the package
npm run build

# Link locally for testing
npm link

# In your n8n directory, link the package
cd ~/.n8n
npm link n8n-nodes-indiamart

# Restart n8n
n8n start
```

### Cloud Deployment

For n8n Cloud:
1. Log in to your n8n Cloud account
2. Go to **Settings** → **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-indiamart`
5. Click **Install** and wait for completion

See the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation for more details.

## Operations

This package includes the following nodes:

### 1. IndiaMART Search
Search for products on IndiaMART by keyword and location, retrieve a list of matching suppliers and products.

**Type:** Transform  
**Category:** Data transformation and search operations

### 2. IndiaMART Post Requirement
Post a product requirement on IndiaMART to generate sourcing requests and connect with suppliers.

**Type:** Output  
**Category:** Data output and integration operations

## Compatibility

Tested locally against n8n v1.104.2.

## Usage

### IndiaMART Search Node

#### Parameters

The IndiaMART Search node accepts the following parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Keyword | String | ✅ Yes | Empty | Search term to query on IndiaMART (e.g., "school bags", "office supplies") |
| City | String | ❌ No | Empty | City/location to filter search results (e.g., "Mumbai", "Delhi") |
| Country | String | ❌ No | Empty | Country name to filter results (e.g., "India") |

#### Input

Accepts data from previous nodes. The node can read parameters from:
- **Node UI:** Directly entered values in the node configuration
- **Input JSON:** Previous node output with `keyword`, `city`, and `country` properties

#### Output

Returns an array of items, each containing:

```json
{
  "keyword": "toys",
  "city": "Mumbai",
  "country": "India",
  "products": [
    {
      "name": "Plastic Dancing Cactus Toy",
      "number": "8044562706",
      "companyname": "Shree Lalankrupa Enterprise",
      "image": "http://5.imimg.com/data5/SELLER/Default/2024/3/405052888/TF/TX/ZQ/214979800/dancing-cactus-toy-500x500.jpeg",
      "smalldescorg": "Dancing toys for children"
    }
  ],
  "searchedAt": "2026-01-05T10:30:00.000Z",
  "skipped": false
}
```

**Output Fields:**
- **keyword:** The search keyword used
- **city:** City filter applied (if any)
- **country:** Country filter applied (if any)
- **products:** Array of matching products with:
  - **name:** Product name
  - **number:** Product/SKU number
  - **companyname:** Supplier/company name
  - **image:** Product image URL
  - **smalldescorg:** Short product description
- **searchedAt:** Timestamp of the search
- **skipped:** Boolean indicating if the row was skipped (e.g., status is "used")

#### Error Handling

- **"Keyword is required"**: Provide a keyword either in the node UI or in the input JSON
- **API Failures:** The node will throw a `NodeOperationError` if IndiaMART API is unreachable
- **Empty Results:** Returns an empty products array if no matches found

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

#### Parameters

The IndiaMART Post Requirement node accepts the following parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Product Name | String | ✅ Yes* | Empty | Name of the product for which you're posting a requirement |
| Contact (Mobile / Email) | String | ✅ Yes* | Empty | Contact number or email address for the requirement |

**Note:** Fields marked with * are required, but can be sourced from:
- **Node UI:** Directly entered values
- **Input JSON:** From previous node output (e.g., AI agent output or spreadsheet)

#### Input

Accepts data from previous nodes. The node can process:
- **Product Name:** From UI input OR from `output` field (AI agent JSON output)
- **Contact:** From UI input OR from `mobile` field OR from AI output's `user_info` field

#### Output

Returns an array of items with the following structure:

```json
{
  "status": "posted",
  "postedProduct": "LED Lights",
  "contactUsed": "7233191224",
  "message": "Requirement posted successfully",
  "best_product": {
    "name": "LED Lights - 10W",
    "number": "8044562706",
    "companyname": "Electronics Supplier",
    "user_info": "7233191224"
  }
}
```

#### Error Handling

- **"Product name missing"**: Provide product name in UI or ensure AI output contains valid product data
- **"Contact is required"**: Provide contact via UI, sheet data, or AI output
- **"Invalid GEO API response"**: Location detection failed; try again or check network
- **"glid not found in login"**: Authentication issue; the node couldn't establish a session
- **"Failed to post requirement"**: IndiaMART API returned an error; verify product name is valid

#### Continue on Fail

When enabled, errors are caught and stored in `item.json.error` instead of stopping execution:
- Useful for batch processing where you want to skip individual errors
- Check the `error` field in output to diagnose issues

## Usage

### Quick Start

1. Install the n8n-nodes-indiamart package
2. Reload n8n or restart the server
3. Create a new workflow
4. Add either **IndiaMART Search** or **IndiaMART Post Requirement** node
5. Configure parameters as needed
6. Connect to other nodes in your workflow
7. Execute and monitor results

### Common Workflows

#### Automated Lead-to-Post
**Scenario:** A customer emails you asking for a specific bulk item.

```
[Gmail Trigger] → [AI Agent] → [IndiaMART Search] → [IndiaMART Post Requirement] → [Log Output]
```

1. **Gmail receives an email:** "I need 500 wooden toy cars."
2. **AI Agent:** Extracts the keyword "wooden toy cars".
3. **IndiaMART Search:** Scans for existing suppliers to check market prices.
4. **IndiaMART Post Requirement:** Automatically posts requirement on Indiamart so suppliers for wooden toy cars contact you directly.

#### Spreadsheet Batch Sourcing
**Scenario:** You have a list of products in a Google Sheet that you need to source.

```
[Google Sheets Trigger] → [AI Agent] → [IndiaMART Search] → [IndiaMART Post Requirement] → [Update Sheet]
```

1. **New row added to Google Sheets:** "Product: LED Lights".
2. **AI Agent:** Extracts the product keyword to search.
3. **IndiaMART Search:** Finds the top 10 current listings for LED Lights.
4. **IndiaMART Post Requirement:** Post requirement on Indiamart to connect with  verified suppliers.

## Author

**Gyaneshwar Mongha**
- Email: gyaneshwar.mongha@indiamart.com
- GitHub: [@gyaneshwar](https://github.com/gyaneshwar)

## Resources

* [n8n Documentation](https://docs.n8n.io/)
* [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)
* [IndiaMART Website](https://www.indiamart.com)
* [Community Nodes on npm](https://www.npmjs.com/search?q=keywords:n8n-community-node-package)
