const { Flow } = require('./src/Models');
const sequelize = require('./src/Config/database');

async function checkFlows() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const flows = await Flow.findAll();
        console.log(`Found ${flows.length} flows.`);

        if (flows.length > 0) {
            flows.forEach(f => {
                console.log(`- [${f.id}] ${f.name} (Active: ${f.is_active})`);
                console.log(`  Nodes: ${Object.keys(f.nodes).length}`);
            });
        } else {
            console.log('No flows found. PLEASE SEED.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkFlows();
