import sql from "mssql";

export async function GET() {
    let pool;
    try {
        pool = await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: {
                encrypt: true,
                trustServerCertificate: false,
            },
        });

        // Updated query to use separate lat and long columns
        const result = await pool.request().query(
            "SELECT id, name, lat, long, description, start_date, end_date FROM protests"
        );

        const protests = result.recordset.map(protest => {
            // Create location object from separate columns
            const locationObj = {
                lat: protest.lat !== null ? Number(protest.lat) : null,
                lng: protest.long !== null ? Number(protest.long) : null
            };

            return {
                id: protest.id,
                name: protest.name,
                location: locationObj, // Keep the same structure expected by Map component
                description: protest.description,
                date: protest.start_date,
            };
        });

        return new Response(JSON.stringify(protests), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Database error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch data", message: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    } finally {
        if (pool) await pool.close();
    }
}

export async function POST(request) {
    let pool;
    try {
        // Parse the incoming JSON request
        const protestData = await request.json();

        // Validate required fields
        if (!protestData.name || !protestData.description || !protestData.date ||
            !protestData.location || protestData.location.lat === null || protestData.location.lng === null) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Connect to database
        pool = await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: {
                encrypt: true,
                trustServerCertificate: false,
            },
        });

        // Insert new protest data
        const result = await pool.request()
            .input('name', sql.NVarChar, protestData.name)
            .input('description', sql.NVarChar, protestData.description)
            .input('lat', sql.Float, protestData.location.lat)
            .input('long', sql.Float, protestData.location.lng)
            .input('start_date', sql.DateTime, new Date(protestData.date))
            .query(`
                INSERT INTO protests (name, description, lat, long, start_date)
                VALUES (@name, @description, @lat, @long, @start_date);
                SELECT SCOPE_IDENTITY() AS id;
            `);

        // Get the ID of the newly inserted protest
        const newId = result.recordset[0].id;

        return new Response(JSON.stringify({
            success: true,
            message: "Protest added successfully",
            id: newId
        }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Database error:", error);
        return new Response(JSON.stringify({
            error: "Failed to add protest",
            message: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    } finally {
        if (pool) await pool.close();
    }
}