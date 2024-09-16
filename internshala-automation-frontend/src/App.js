
import React, { useState } from 'react';

import './App.css'

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [numberOfJobs, setNumberOfJobs] = useState('1');
  const [errorMessage, setErrorMessage] = useState('');
  const [whyHire, setWhyHire] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [skippedJobs, setSkippedJobs] = useState([]);

  const predefinedAnswer = `I bring a strong blend of relevant skills, adaptability, and a commitment to continuous learning. My experience aligns with the requirements of the role, and I am confident in my ability to contribute effectively while also growing within the company. I'm eager to bring fresh ideas, work collaboratively, and deliver results that add value to the team.`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const response = await fetch('http://localhost:5000/run-automation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, numberOfJobs: parseInt(numberOfJobs), whyHire }),
        });

        const result = await response.json();

        if (!response.ok) {
            const errorData = await response.json(); 
            setErrorMessage(errorData.message || 'An error occurred during the automation process.');
        } else {
            setErrorMessage('Automation successfully completed!');
            setSkippedJobs(result.skippedJobs || []);
        }
    } catch (error) {
        setErrorMessage('An error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
};

  const fillWhyHireAnswer = () => {
    setWhyHire(predefinedAnswer);
  };

  const closeSkippedJobsModal = () => {
    setSkippedJobs([]);
  };

  return (
    <div className="App">
      {isLoading ? <div className="loading">Running automation...</div> : null}
      <div className={skippedJobs.length > 0 ? 'blur-background sub' : 'sub'}>
      <div className='prerequisites'>
        <h3>Things to Remember for Running Automation here: </h3>
        <ul>
          <li>
            <p>Ensure You have an Account in Internshala and give the internshala credentials only here</p>
          </li>
          <li>
            <p>
              Ensure You create your entire Resume in Internshala Account including Education details, projects , trainings and internships etc as it will be used to submit your application.
            </p>
          </li>
          <li>
            Ensure you save your preferences of internship/job domain as the saved preferences will be used.
          </li>
          <li>
            <p>Ensure you give a proper answer for 'Why should you be hired for this role' in the form</p>
          </li>
        </ul>
      </div>
      <div>
      <h3>Automate Applying jobs in your Internshala</h3>
      <form onSubmit={handleSubmit}>
        <div className='form-div'>
          <input
            type="email"
            placeholder="Enter email of your internshala account"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter password  of your internshala account"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className='why-hire-div'>
            <h5> Enter your answer for 'Why should you be hired for this role?' or fill it with the below predefined answer by clicking it</h5>
            <textarea
              placeholder="Enter your response"
              value={whyHire}
              onChange={(e) => setWhyHire(e.target.value)}
              required
              rows="4"
              cols="70"
            />
            
            <div className="predefined-answer-container" onClick={fillWhyHireAnswer}>
              <p>{predefinedAnswer}</p>
            </div>
          </div>

          <h4>Select Number of jobs you want to apply</h4>
          <div className='jobschoice'>
          <select 
            value={numberOfJobs}
            onChange={(e) => setNumberOfJobs(e.target.value)}
            required
          >
            <option value="1">1 Job</option>
            <option value="5">5 Jobs</option>
            <option value="10">10 Jobs</option>
            <option value="15">15 Jobs</option>
          </select>
          </div>
          <button type="submit">Run Automation</button>
          <p className='error-message'>{errorMessage}</p>
        </div>
      </form>
      </div>

      

      </div>

      {skippedJobs.length > 0 && (
          <div className="skipped-jobs">
            <button className="close-button" onClick={closeSkippedJobsModal}>×</button>
            <h4>Could Not Apply to the Following Jobs Due to Additional Questions:</h4>
            <ul>
              {skippedJobs.map((jobLink, index) => (
                <li key={index}>
                  <a href={`https://internshala.com${jobLink}`} target="_blank" rel="noopener noreferrer">
                    {`https://internshala.com${jobLink}`}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}

export default App;
