// src/__tests__/data.test.ts
import request from 'supertest';
import app from '../app';
import { ALLOWED_VIEWS } from '../constants/views';

// Mocking the database connection is often better for isolation, 
// but for this example, we'll use the real DB connection established in setupTests.ts
// If you want to mock, you'd do it here and not use setupTests.ts to connect.

// Retrieve the globally available DB pool if needed for specific assertions
// const dbPool = global.__dbPool; 

describe('Data Endpoints Integration Tests', () => {

    // Fetch available views once to test them all
    let views: string[] = [];

    beforeAll(async () => {
        const response = await request(app).get('/api/views');
        views = response.body.views;

        // Ensure our allowed views constant matches the ones returned by the API
        expect(views).toEqual(expect.arrayContaining(ALLOWED_VIEWS));
        expect(views.length).toBeGreaterThan(0); // Make sure we got some views
    });

    // Test case for fetching the list of views
    test('GET /api/views should return a list of available views', async () => {
        const response = await request(app).get('/api/views');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('views');
        expect(Array.isArray(response.body.views)).toBe(true);
        expect(response.body.views.length).toBeGreaterThan(0);
        // Optionally, check if specific views are present
        expect(response.body.views).toContain('aaron_view_Clientes');
    });

    // Test case for fetching data for each allowed view
    describe('GET /api/dashboard/:viewName', () => {
        // Test with a small limit to ensure pagination works
        const testLimit = 5; 

        // Dynamically create tests for each view
        ALLOWED_VIEWS.forEach((viewName) => {
            test(`should return data for view "${viewName}" with pagination`, async () => {
                const response = await request(app)
                    .get(`/api/dashboard/${viewName}`)
                    .query({ page: 1, limit: testLimit }); // Use query params for pagination

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('metadata');
                expect(response.body).toHaveProperty('totals');
                expect(response.body).toHaveProperty('data');

                expect(response.body.metadata.view).toBe(viewName);
                expect(response.body.metadata.page).toBe(1);
                expect(response.body.metadata.limit).toBe(testLimit);
                expect(response.body.data.length).toBeLessThanOrEqual(testLimit); // Should be <= limit

                // Basic checks for totals object structure
                expect(response.body.totals).toBeInstanceOf(Object);
                // You can add more specific checks here if you know the expected keys in totals
                // For example: expect(response.body.totals).toHaveProperty('someNumericKey');

                // Basic checks for data array structure
                expect(response.body.data).toBeInstanceOf(Array);
                if (response.body.data.length > 0) {
                    // Check if the first row has some expected properties (can be complex due to varying schemas)
                    // This is a generic check, adjust if you know common fields
                    const firstRow = response.body.data[0];
                    expect(firstRow).toBeInstanceOf(Object);
                    // Example: Check for a common identifier if known, e.g., 'id' or 'codigo'
                    // expect(firstRow).toHaveProperty('id'); 
                }
            });

            // Test for invalid view name
            test(`should return 400 for an invalid view name`, async () => {
                const response = await request(app)
                    .get(`/api/dashboard/invalid_view_name_xyz`);

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Invalid View Name requested.');
            });
        });
    });

    // Example test for a specific view with more detailed assertions
    // You can uncomment and customize this for critical views.
    /*
    test('should return specific data for aaron_view_Clientes', async () => {
        const response = await request(app)
            .get('/api/dashboard/aaron_view_Clientes')
            .query({ limit: 2 }); // Get first 2 for easier inspection

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(2);
        
        // Check the structure of the first row more specifically
        const firstClient = response.body.data[0];
        expect(firstClient).toHaveProperty('G200000988'); // Assuming this is a client ID column
        expect(firstClient).toHaveProperty('INSTITUTO AUTONOMO HOSPITAL UNIVERSITARIO DE CARACAS'); // Assuming this is a name column

        // Check totals if you know what to expect
        // expect(response.body.totals.someNumericField).toBe(expectedValue);
    });
    */
});