const ZApiService = require('./src/Services/ZApi.service');

function testFormatPhone() {
    console.log('--- Testing formatPhone ---');

    const testCases = [
        { input: '11999999999', expected: '5511999999999' },
        { input: '5511999999999', expected: '5511999999999' },
        { input: '(11) 99999-9999', expected: '5511999999999' },
        { input: '120363025807982269@g.us', expected: '120363025807982269@g.us' },
        { input: '551199999-9999@g.us', expected: '551199999-9999@g.us' }, // Theoretical worst case
    ];

    let passed = 0;
    testCases.forEach((tc, index) => {
        const result = ZApiService.formatPhone(tc.input);
        const match = result === tc.expected;
        if (match) passed++;

        console.log(`Test Case ${index + 1}:`);
        console.log(`  Input:    ${tc.input}`);
        console.log(`  Expected: ${tc.expected}`);
        console.log(`  Result:   ${result}`);
        console.log(`  Status:   ${match ? 'PASS' : 'FAIL'}`);
        console.log('---');
    });

    console.log(`Total Passed: ${passed} / ${testCases.length}`);
}

testFormatPhone();
