const axios = require('axios');

async function test() {
    try {
        const response = await axios.get('http://localhost:3002/api/flows');
        console.log('API Response Structure:', JSON.stringify(response.data, null, 2));
        const flows = response.data.data;
        if (flows.length > 0) {
            console.log('First Flow Nodes:', JSON.stringify(flows[0].nodes, null, 2));
        } else {
            console.log('No flows found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}
test();
