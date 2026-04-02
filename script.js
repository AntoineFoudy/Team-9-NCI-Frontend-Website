// API BASE URL

const API_URL = "http://52.16.133.37:8080";
const API_LOCATION_URL = "https://www.googleapis.com/geolocation/v1/geolocate?";
const LOCATION_KEY = "AIzaSyA7y6tiN4jCAqErJwRX9snh79AATgU7e8k";


// declaring variable submit
let submit;

// Defining a value for submit only if the login page is open
if(document.getElementById("submit")) {
  submit = document.getElementById("submit");
  submit.addEventListener("click", login);
};


/* =========================================
   LOGIN
   Sends a login request to the backend using
   the email and password entered by the user.
   if correct redirects user to dahsboard page
========================================= */
async function login() {
  const loginEmail = document.getElementById("email").value;
  const loginPassword = document.getElementById("password").value;
  const errorEl = document.getElementById("error");


  // Clear previous error message before trying again
  if (errorEl) {
    errorEl.innerText = "";
  }

  try {
    // Send login request to backend
    const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      loginEmail,
      loginPassword
    })
  });


    const data = await response.json();
   //  console.log(data);

    // Assign userID
    const userId = data.userID;

    // Store logged-in user details locally
    localStorage.setItem("userId", userId);
    localStorage.setItem("userEmail", email);

    // Call Get User's Location function
    await getUserLocation();

    // Redirect user to dashboard after login
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);

    // Show error message if login fails
    if (errorEl) {
      errorEl.innerText = "Login failed";
    }
  }
}

// Get User's Coordinates
async function getUserLocation() {
  const userId = localStorage.getItem("userId");
  try {
    // Send login request to backend
    const response = await fetch(
      `${API_LOCATION_URL}key=${LOCATION_KEY}`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

    const data = await response.json();
    const lat = data.location.lat;
    const lng = data.location.lng;

    console.log(lat, lng);
    
    // Post User's Coordinates to the backed to be updated in the database
    await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        lastLatitude: lat,
        lastLongitude: lng
      })
    });
  } 
  catch (error) {
    console.error(error);
  }
}

/* =========================================
   SHOW USER DETAILS
   Displays the current userId on the page
========================================= */
function showUserDetails() {
  const userId = localStorage.getItem("userId");
  const userIdDisplay = document.getElementById("userIdDisplay");

  if (userIdDisplay) {
    userIdDisplay.innerText = userId || "Not available";
  }
}

/* =========================================
   NAVIGATION FUNCTIONS
========================================= */
function goToDashboard() {
  window.location.href = "dashboard.html";
}

function goToCreateEvent() {
  window.location.href = "create-event.html";
}

function goToViewEvents() {
  window.location.href = "view-events.html";
}

/* =========================================
   LOGOUT
   Removes locally stored login details and
   returns the user to the login page.
========================================= */
function logout() {
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  window.location.href = "login.html";
}

  // CREATE EVENT 
 //  Sends a new event to the backend using 

async function addEvent() {
  const description = document.getElementById("description")?.value || "";
  let dateTime = document.getElementById("dateTime").value;
  const address = window.selectedAddress;
  const userId = localStorage.getItem("userId");
  const messageEl = document.getElementById("eventMessage");

  // Clear previous message
  if (messageEl) {
    messageEl.innerText = "";
  }

  // Validate  
  if (!dateTime || !address) {
    if (messageEl) {
      messageEl.innerText = "Please fill in all fields.";
    }
    return;
  }

  // Convert date/time format for backend 
  dateTime = new Date(dateTime).toISOString();

  try {
    // Send event data to backend
    await fetch(`${API_URL}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        description: description,
        dateTime: dateTime,
        address: address
      })
    });

    // Show success message
    if (messageEl) {
      messageEl.innerText = "Event added";
    }
  } catch (error) {
    console.error(error);

    // Show error message
    if (messageEl) {
      messageEl.innerText = "Failed to add event";
    }
  }
}

//DELETE EVENT 
async function deleteEvent(scheduleId) {
  if (!confirm("Are you sure you want to delete this event?")) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/schedule?scheduleId=${scheduleId}`, {
      method: "DELETE"
    });
    if (res.ok) {
      alert("Event deleted successfully");

      // auto reload events
      getEvents(); 
    } else {
      alert("Failed to delete event");
    }
    //ERROR HANDLING
  } catch (error) {
  
    alert("Error deleting event");
  }
}


  // GET EVENTS 
  // Fetches all events for the current user 

async function getEvents() {
  const userId = localStorage.getItem("userId");
  const container = document.getElementById("events");
  const calendar = document.getElementById("calendar");
  const description = document.getElementById("description");
  const selectedDateEvents = document.getElementById("selected-date-events");

  if (!container) return;

  // Clear other sections before showing event list
  container.innerHTML = "";
  if (calendar) calendar.innerHTML = "";
  if (selectedDateEvents) selectedDateEvents.innerHTML = "";

  try {

    // Fetch events from backend
    const response = await fetch(`${API_URL}/schedule?userId=${userId}`);
    const events = await response.json();

    events.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    // If no events exist
    if (!events.length) {
      container.innerHTML = "<p>No events found.</p>";
      return;
    }

    // Render each event as a card
    events.forEach(event => {

      const status = new Date(event.dateTime) > new Date() 
      ? '<span style = "color: green;">Upcoming</span>'
      : '<span style = "color: red;">Completed</span>';

      const div = document.createElement("div");
      div.className = "event";

      div.innerHTML = `
        <p><b>Date:</b> ${event.dateTime}</p>
        <p><b>Description:</b> ${event.description}</p>
        <p><b>address:</b> ${event.address || "Not available"}</p>
        <p><b>status:</b> ${status }</p>
        <button onclick="deleteEvent(${event.scheduleId})">Delete</button>


        <iframe
        width="100%"
       height="200"
       style="border:0; margin-top:10px;"
       loading="lazy"
       src="https://www.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed">
       </iframe>
      `;

      container.appendChild(div);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Failed to load events</p>";
  }
}


/* =========================================
   VIEW CALENDAR
   shows monthly calendar for the current
   month and highlights on days
   that have events.
========================================= */
async function viewCalendar() {
  const userId = localStorage.getItem("userId");

  // Main containers used on the page
  const calendar = document.getElementById("calendar");
  const eventsContainer = document.getElementById("events");
  const selectedDateEvents = document.getElementById("selected-date-events");

  // Clear previous event list
  calendar.innerHTML = "";
  if (eventsContainer) eventsContainer.innerHTML = "";
  if (selectedDateEvents) selectedDateEvents.innerHTML = "";

  try {
    // Fetch all events for the current user
    const events = await fetch(`${API_URL}/schedule?userId=${userId}`).then(res => res.json());

    // Get the current month and year from the system date
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // Arrays lists 
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Find what weekday the month starts on
    const firstDay = new Date(year, month, 1).getDay();

    // Find how many days are in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build the main calendar structure:
    // 1. Month title
    // 2. Weekday labels
    calendar.innerHTML = `
      <div class="calendar-title">${monthNames[month]} ${year}</div>
      <div class="calendar-weekdays">
        ${dayNames.map(day => `<div>${day}</div>`).join("")}
      </div>
      <div class="calendar-grid" id="calendar-grid"></div>
    `;

    const grid = document.getElementById("calendar-grid");

    
    for (let i = 0; i < firstDay; i++) {
      grid.innerHTML += `<div class="calendar-day empty"></div>`;
    }

    // Create one calendar cell for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Filter events that belong to this exact calendar day
      const dayEvents = events.filter(e => {
        const d = new Date(e.dateTime);
        return (
          d.getDate() === day &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      });

      
      const cell = document.createElement("div");
      cell.className = "calendar-day";

      // Show day number and event marker if events exist
      cell.innerHTML = `
        <div class="day-number">${day}</div>
        ${
          dayEvents.length
            ? `<div class="event-marker">• ${dayEvents.length} Event${dayEvents.length > 1 ? "s" : ""}</div>`
            : ""
        }
      `;

      // When the user clicks a day:
      // - Show all events for that date
      // - If none exist, show "No events for this day"
      cell.onclick = () => {
        selectedDateEvents.innerHTML = `
          <div class="selected-events-box">
          <h3>Events on ${monthNames[month]} ${day}</h3>
           ${
            dayEvents.length
            ? dayEvents.map(e => `
              <div class="selected-event-item">
              <p><strong>Time:</strong> ${new Date(e.dateTime).toLocaleTimeString([], {
                  hour: "2-digit",
                   minute: "2-digit"
               })}</p>
               <p><strong>address:</strong> ${e.address || "Not available"}</p>
              </div>
              `).join("")
                : "<p>No events for this day.</p>"
            }
          </div>
        `;
      };

      // Add finished day cell into the calendar grid
      grid.appendChild(cell);
    }
  } catch (error) {
    console.error(error);

    // Show error message in calendar area if fetch fails
    calendar.innerHTML = "<p>Failed to load calendar</p>";
  }
}

//load upcominG events
async function loadUpcomingEvents() {
const container = document.getElementById("upcomingEvents");
const details = document.getElementById("eventDetails");

if (!container || !details) return;

try {
const res = await fetch(`${API_URL}/schedule?userId=${localStorage.getItem("userId")}`);
const events = await res.json();

const now = new Date();

const upcoming = events
.filter(e => new Date(e.dateTime) > now)
.slice(0, 2);

container.innerHTML = "";

upcoming.forEach(event => {
const date = new Date(event.dateTime);

const div = document.createElement("div");
div.className = "event";

div.innerHTML = `
<p><strong>Date:</strong> ${date.toLocaleDateString()}</p>
<p><strong>Time:</strong> ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
<p><strong>Location:</strong> ${event.location || event.address}</p>
<p><strong>Description:</strong> ${event.description || "No description"}</p>
`;

div.onclick = () => {
details.innerHTML = `
<p><strong>Date:</strong> ${date.toLocaleDateString()}</p>
<p><strong>Time:</strong> ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
<p><strong>Description:</strong> ${event.description || "No description"}</p>

<iframe
width="100%"
height="280"
style="border:0; margin-top:10px;"
src="https://www.google.com/maps?q=${encodeURIComponent(event.location || event.address)}&output=embed">
</iframe>
`;
};

container.appendChild(div);
});

} catch (err) {
console.error(err);
container.innerHTML = "<p>Error loading events</p>";
}
}

//Load attendance 
async function loadAttendance() {
  try {
    const userId = localStorage.getItem("userId");

    const res = await fetch(`${API_URL}/tardiness?userId=${userId}`);
    const data = await res.json();

    document.getElementById("latesCount").innerText = data[0] ?? 0;
    document.getElementById("onTimesCount").innerText = data[1] ?? 0;

  } catch (error) {
    
    document.getElementById("latesCount").innerText = "0";
    document.getElementById("onTimesCount").innerText = "0";
  }
}

//load most visited locations 
async function loadMostVisitedLocation() {
  try {
    const userId = localStorage.getItem("userId");

    const res = await fetch(`${API_URL}/location?userId=${userId}`);
    const data = await res.json();

    document.getElementById("mostVisitedLocation").innerText =
      data[0] || "No locations Available";

  } catch (error) {
    console.error("Error loading location:", error);
    document.getElementById("mostVisitedLocation").innerText = "Error";
  }
}

//run function on startup. 
if (window.location.pathname.includes("dashboard.html")) {
showUserDetails();
loadUpcomingEvents();
loadAttendance();
loadMostVisitedLocation();
}


//SIGN UP
document.getElementById("signupBtn").addEventListener("click", function () {

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    fetch("http://52.16.133.37:8080/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password
        })
    })
    .then(response => {
        console.log("Status:", response.status);

        if (response.status === 200 || response.status === 201) {
            // SUCCESS
            document.getElementById("success").style.display = "block";
            document.getElementById("error").style.display = "none";

            // optional: redirect after 2 seconds
            setTimeout(() => {
                window.location.href = "Login.html";
            }, 2000);

        } else {
            // FAIL
            document.getElementById("error").style.display = "block";
            document.getElementById("success").style.display = "none";
        }
    })
    .catch(error => {
        console.log(error);
        document.getElementById("error").style.display = "block";
        document.getElementById("success").style.display = "none";
    });

});