const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const readline = require('readline');  // To wait for user input

const app = express();
app.use(cors());
app.use(express.json());




const summaryAnswer = `I bring a strong blend of relevant skills, adaptability, and a commitment to continuous learning. 
        My experience aligns with the requirements of the role, and I am confident in my ability to contribute effectively 
        while also growing within the company. 
        I'm eager to bring fresh ideas, work collaboratively, and deliver results that add value to the team.`

// Function to wait for user input (pauses the script)
function waitForUserInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question('Solve the CAPTCHA and press Enter to continue...', () => {
            rl.close();
            resolve();
        });
    });
}

// Function to check if CAPTCHA error popup appears and handle it manually
async function detectCaptchaError(tab, browser, res) {
    try {
        // Wait for the CAPTCHA error message to appear (update selector as per the site's markup)
        await tab.waitForSelector('.text-message.body-main.small-device-text-center', { visible: true, timeout: 5000 });
        console.log('CAPTCHA detected! Closing the browser and stopping automation.');
        await browser.close();  // Close the browser when CAPTCHA is detected
        
        // Respond with CAPTCHA error
        res.status(500).json({ message: "CAPTCHA detected. Automation stopped." });

        // Throw an error to stop further execution in case of CAPTCHA
        throw new Error('CAPTCHA detected. Automation stopped.');
    } catch (error) {
        if (error.message.includes('CAPTCHA detected')) {
            throw error;  // Re-throw the error to stop execution
        }
        console.log('No CAPTCHA popup detected, proceeding with the automation...');
    }
}


async function applyForJob(browser, jobLink, whyHire, skippedJobs) {
    try {
        const jobTab = await browser.newPage();
        await jobTab.goto(`https://internshala.com${jobLink}`); 

        console.log(`opened link : ${jobLink}`);

        await jobTab.waitForSelector('#easy_apply_button');
        await jobTab.click('#easy_apply_button');
        console.log("apply button clicked");

        const hasAssesment = await jobTab.evaluate(() => {
            // Check if there's a specific assessment section or question present
            const assessmentDiv = document.querySelector('#assessment_questions');
            return assessmentDiv !== null;
        });

        console.log(hasAssesment);

        if(hasAssesment) {
            console.log(`Assesment Detected, skipping the job ${jobLink}`);
            skippedJobs.push(jobLink);
            console.log(skippedJobs);
            await jobTab.close();
            return;
        }

        await jobTab.waitForSelector('#cover_letter_holder .ql-editor', {visible: true});
        await jobTab.click('#cover_letter_holder .ql-editor');
        await jobTab.type('#cover_letter_holder .ql-editor', whyHire);

        console.log("Filled Answer");

        await jobTab.click('#submit');
        console.log("submitted");

        await jobTab.close();

    }catch(error) {
        console.log(`Error applying the job: ${jobLink}`, error);
    }
}

app.post('/run-automation', async (req, res) => {
    const { email, password, numberOfJobs, whyHire } = req.body;
    let skippedJobs = [];
    
    try {
        const browser = await puppeteer.launch({
            headless: false,           // Launches browser in non-headless mode
            defaultViewport: null,      // Maximizes the window
            args: ["--start-maximized"]
        });

        const [tab] = await browser.pages();
        await tab.goto("https://internshala.com/");
        await tab.click("button.login-cta");       // Clicking login button
        await tab.type("#modal_email", email);     // Typing email
        await tab.type("#modal_password", password); // Typing password
        await tab.click("#modal_login_submit");    // Submitting form

        // Detect CAPTCHA popup and wait for manual solving
        await detectCaptchaError(tab, browser);

        // Wait for successful login confirmation else redirects to internships page without login
        await tab.waitForSelector('#internships_new_superscript', { timeout: 60000 });
        console.log('Login successful.');

        // redirect to internships page
        await tab.goto("https://internshala.com/internships");
        console.log('Navigated to Internships page.');

        // Get all internship job links into an array
        let jobLinks = await tab.evaluate(() => {
            let links = [];
            document.querySelectorAll('.job-title-href').forEach((element) => {
                let jobCard = element.closest('.container-fluid.individual_internship');
                let statusSuccess = jobCard.querySelector('.status-success');
                if (statusSuccess) {
                    links.push(element.getAttribute('href'));
                }
            });
            return links;
        });

        jobsFetched = parseInt(jobLinks.length)
        jobLinks = jobLinks.slice(0, numberOfJobs<=jobsFetched ? numberOfJobs : jobsFetched);
        console.log('Found job links:', jobLinks);

        for (const jobLink of jobLinks) {
            await applyForJob(browser, jobLink, whyHire, skippedJobs);
        }

        res.json({message: 'Automation Done', skippedJobs});
        browser.close();
    } catch (error) {
        console.error('Error during automation:', error);
        res.status(500).json({ message: error.message || 'Automation failed.' });  // Ensure message is a string
    }
});


app.listen(5000, () => {
    
    console.log('Server is running on http://localhost:5000');
});
