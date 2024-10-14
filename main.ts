import * as http from "http";
import * as dotenv from "dotenv";
import { init } from "./execute";
dotenv.config();

// Start the HTTP Server
const server = http.createServer(async (req, res) => {

    const blogPostSourceUrl = 'https://www.grorapidlabs.com/blog/how-to-publish-an-ios-app-on-the-app-store-a-comprehensive-guide';

    const response = await init(blogPostSourceUrl);

    console.log({response});
    res.end(response.content);
});


const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server running at PORT: ${PORT}`);
});
