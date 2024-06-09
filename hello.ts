import { BskyAgent, AtpSessionEvent, AtpSessionData } from '@atproto/api';
import Swal from 'sweetalert2';

const agent = new BskyAgent({
  service: 'https://bsky.social',
  persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
    if (sess) {
      const sessionWithExpiry = {
        data: sess,
        expiry: new Date().getTime() + 15 * 60 * 1000 // 15 minutes expiry time
      };
      agent.session = sess;
      localStorage.setItem('SESSION_KEY', JSON.stringify(sessionWithExpiry));
    }
  },
});
async function login() {
  try {
    const identifier = identifierInput.value;
    const password = passwordInput.value;

    await agent.login({
      identifier,
      password
    });
    const sessionWithExpiry = {
      data: agent.session,
      expiry: new Date().getTime() + 15 * 60 * 1000 // 15 minutes expiry time
    };
    localStorage.setItem('SESSION_KEY', JSON.stringify(sessionWithExpiry));
    localStorage.setItem('HANDLER', identifier);
    homeDiv.style.display = 'block';
    mainDiv.style.display = 'none';
    identifierInput.value = '';
    passwordInput.value = '';
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: 'There was an error logging in. Please check your credentials and try again.'
    });
    console.error('Error:', error);
  }
}
function isSessionExpired() {
  const sessionString = localStorage.getItem('SESSION_KEY');
  if (sessionString) {
    const session = JSON.parse(sessionString);
    return new Date().getTime() > session.expiry;
  }
  return true; // Session expired if not found in localStorage
}
function getSessionData() {
  const sessionString = localStorage.getItem('SESSION_KEY');
  if (sessionString) {
    const session = JSON.parse(sessionString);
    if (!isSessionExpired()) {
      return session.data;
    }
  }
  return null; // Session expired or not found
}
async function unfollow(did: string) {
    try {
        const { uri } = await agent.follow(did);
        await agent.deleteFollow(uri);
    } catch (error) {
        console.error('Error:', error);
    }
}
// export { unfollow };
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginBtn');
    if (loginButton) {
        loginButton.addEventListener('click', login);
    } else {
        console.warn('Element with id "loginBtn" not found.');
    }

    if (isSessionExpired()) {
        console.log('Session expired.');
    } else {
        // Session valid, retrieve session data
        const sessionData = getSessionData();
        console.log('Session data:', sessionData);
    }
});


    // Perform unfollow
    // const { uri } = await agent.follow('did:plc:z72i7hdynmk6r22z27h6tvur');
    // await agent.deleteFollow(uri);

const aBtn = document.getElementById('findNotFollowingBack') as HTMLButtonElement;
const bBtn = document.getElementById('findNotYouFollowBack') as HTMLButtonElement;
const cBtn = document.getElementById('findMutuals') as HTMLButtonElement;
const dBtn = document.getElementById('findFollowers') as HTMLButtonElement;
const eBtn = document.getElementById('findFollows') as HTMLButtonElement;
const userDiv = document.getElementById('user-container') as HTMLDivElement;
const loaderDiv = document.getElementById("loaderOverlay") as HTMLDivElement;
const homeDiv = document.getElementById('home') as HTMLDivElement;
const mainDiv = document.getElementById('main') as HTMLElement;
const identifierInput = document.getElementById('floatingInput') as HTMLInputElement;
const passwordInput = document.getElementById('floatingPassword') as HTMLInputElement;

let cursorFers: string = '';
let cursorFs: string = '';
// console.log('rain on me');

async function checkProfile(actor: string) {
    try {
        const url = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${actor}`;
        // Make the API request
        const response = await fetch(url);

        // Check if the response is OK (status code 200-299)
        if (response.status === 400) {
            return false;
        } else if (!response.ok) {
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw error;
    }
}
async function fetchFollowersWithPagination(limit = 100) {
    try {
        const actor = String(localStorage.getItem('HANDLER'));
        let hasNextPage = true;
        var data = [];
        while (hasNextPage) {
        // Construct the URL with query parameters
        const url = `https://public.api.bsky.app/xrpc/app.bsky.graph.getFollowers?actor=${actor}&limit=${limit}${
            cursorFers ? `&cursor=${cursorFers}` : ""
        }`;

        // Make the API request
        const response = await fetch(url);

        // Check if the response is OK (status code 200-299)
        if (response.status === 400) {
            throw new Error(`There is no data with the related handle!`);
        } else if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the JSON data from the response
        const responseData = await response.json();

        // Append the data to the 'data' array
        data.push(responseData);

        // Extract the cursor for the next page
        cursorFers = responseData.cursor;

        // Check if there are more pages
        hasNextPage = cursorFers != null;
        }
        const mergedArray = data.flatMap((set) => set.followers);
        return mergedArray;
    } catch (error) {
        console.error("Error fetching followers:", error);
        return [];
    }
}

      async function fetchFollowsWithPagination(limit = 100) {
        try {
            const actor = String(localStorage.getItem('HANDLER'));
          let hasNextPage = true;
          var data = [];
          while (hasNextPage) {
            // Construct the URL with query parameters
            const url = `https://public.api.bsky.app/xrpc/app.bsky.graph.getFollows?actor=${actor}&limit=${limit}${
              cursorFs ? `&cursor=${cursorFs}` : ""
            }`;

            // Make the API request
            const response = await fetch(url);

            // Check if the response is OK (status code 200-299)
            if (response.status === 400) {
              throw new Error(`There is no data with the related handle!`);
            } else if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Parse the JSON data from the response
            const responseData = await response.json();

            // Append the data to the 'data' array
            data.push(responseData);

            // Extract the cursor for the next page
            cursorFs = responseData.cursor;

            // Check if there are more pages
            hasNextPage = cursorFs != null;
          }
          const mergedArray = data.flatMap((set) => set.follows);
          return mergedArray;
        } catch (error) {
          console.error("Error fetching followers:", error);
          return [];
        }
      }

      async function findUnmatchedData() {
        const handle = String(localStorage.getItem('HANDLER'));
        const followers = await fetchFollowersWithPagination();
        const follows = await fetchFollowsWithPagination();

        if (followers && follows) {
          const followerDids = followers.map((follower) => follower.did);
          const followDids = follows.map((follow) => follow.did);

          const mutuals = followers.filter((follower) =>
            followDids.includes(follower.did)
          );
          const unmatchedFollowers = followers.filter(
            (follower) => !followDids.includes(follower.did)
          );
          const unmatchedFollows = follows.filter(
            (follow) => !followerDids.includes(follow.did)
          );

          return {
            mutuals,
            unmatchedFollowers,
            unmatchedFollows,
          };
        }
      }

      function generateAllUserDataHTML(dataArray: Array<any>, allowed: boolean) {
        let html = "";
        if (dataArray) {
          dataArray.forEach((userData) => {
            const unfoll = allowed
              ? `<a href="javascript:void(0)" class="user-link" data-id="${userData.did}">
                          <button class="btn btn-danger">Unfollow</button>
                        </a>`
              : ``;
            html += `
        <div class="user mb-3 border p-3" id="userMain${
                  userData.did
                }">
            <div class="row justify-content-between">
              <div class="col-sm-2">
                <img src="${
                  userData.avatar
                }" alt="Avatar" width="50" height="50" class="rounded-circle me-2">
              </div>
              <div class="col-sm-8">
                <div class="user-info">
                  <h6 class="fw-bold">${
                    userData.displayName || "No display name"
                  }</h6>
                  <p class="text-muted mb-0">@${
                    userData.handle || "No handle"
                  }</p>
                  <p class="mb-0">${
                    userData.description || "No description"
                  }</p>
                </div>
              </div>
              <div class="col-sm-2 fs-2">
                ${unfoll}
              </div>
            </div>
          </div>`;
          });
        }
        userDiv.innerHTML = html;
        const userLinks = document.querySelectorAll(".user-link");
        userLinks.forEach((link) => {
          link.addEventListener("click", function (event) {
            event.preventDefault();
            loaderDiv.style.display = "flex";
            const element = link as HTMLElement; // Ensure link is treated as an HTMLElement
            const dataId = String(element.dataset.id);
            unfollow(dataId).then(() => {
                // Remove the element with the given ID
                const userElement = document.getElementById('userMain' + dataId);
                if (userElement) {
                    userElement.remove();
                }
                loaderDiv.style.display = "none";
            });
          });
        });
      }
aBtn.onclick = async function() {
    loaderDiv.style.display = "flex";
    const data = await findUnmatchedData();
    if (data) generateAllUserDataHTML(data.unmatchedFollows, true);
    loaderDiv.style.display = "none";
};
bBtn.onclick = async function() {
    loaderDiv.style.display = "flex";
    const data = await findUnmatchedData();
    if (data) generateAllUserDataHTML(data.unmatchedFollowers, false);
    loaderDiv.style.display = "none";
};
cBtn.onclick = async function() {
    loaderDiv.style.display = "flex";
    const data = await findUnmatchedData();
    if (data) generateAllUserDataHTML(data.mutuals, true);
    loaderDiv.style.display = "none";
};
dBtn.onclick = async function() {
    loaderDiv.style.display = "flex";
    const data = await fetchFollowersWithPagination();
    if (data) generateAllUserDataHTML(data, false);
    loaderDiv.style.display = "none";
}
eBtn.onclick = async function() {
    loaderDiv.style.display = "flex";
    const data = await fetchFollowsWithPagination();
    if (data) generateAllUserDataHTML(data, true);
    loaderDiv.style.display = "none";
}