// export function user() {
// 	let user = document.getElementById('user');
// 	let searched_username = document.getElementById('searchInput');
// 	searched_username.onchange = function() {
// 		console.log("searched_username JS = ", searched_username.value);
// 		// console.log("WINDOW HREF = ", window.location.href);
// 		user.href = `/user/${searched_username.value}/`;
// 	};
// }

export function user() { //modif de claire du 26.092.24 pour regler le soucis d'image
    // let user = document.getElementById('user');
    // let profilPicture = document.getElementById('profil-picture');
    // let searched_username = document.getElementById('searchInput');
    // if (searched_username) {
    //     searched_username.onchange = function () {
    //         console.log("searched_username JS = ", searched_username.value);
    //         profilPicture.href = `/user/${searchedUsername.value}/`;
    //     };
    // }

    // POUR LE FORM USER 
    let visibleList = false;
    let templateContactList = document.createElement("template");

    fetchTemplate();

    // POUR LE FORM USER profil et user ?
    let user = document.getElementById('user');
    let searched_username = document.getElementById('searchInput');
    let removeFriendBtn = document.getElementById('removeFriend');
    let addFriendBtn = document.getElementById('addFriend');

    removeFriendBtn.onclick = (e) => {
        let target = e.target.closest(".container").querySelector("#username").innerText;
        console.log("click remove friend: ", target);
        manageFriend("remove", target);
    };

    addFriendBtn.onclick = (e) => {
        let target = e.target.closest(".container").querySelector("#username").innerText;
        console.log("click remove friend: ", target);
        manageFriend("add", target);
    };

    searched_username.addEventListener("keypress", (e) => {
        if (e.key == "Enter")
            user.click();
    });
    user.addEventListener("click", () => {
        if (searched_username.value)
            user.href = `/user/${searched_username.value}/`;
    });

    document.addEventListener("click", (e) => {
        if (visibleList && !e.target.classList.contains("text")) {
            document.getElementById('listContact').classList.replace("visible-profile-y", "invisible-profile-y");
            visibleList = false;
        }
    });

    searched_username.addEventListener("click", () => {

        console.log("click onsearch");
        if (visibleList == false) {
            createListContact()
                .then(() => {
                    document.getElementById('listContact').classList.replace("invisible-profile-y", "visible-profile-y");
                    visibleList = true;
                })
                .catch(error => {
                    console.error('Erreur lors de la création de la liste de contacts :', error);
                });
        }
        else {
            document.getElementById('listContact').classList.replace("visible-profile-y", "invisible-profile-y");
            visibleList = false;
        }
    });

    document.getElementById("ladder").addEventListener("click", () => {
        console.log("click on ladder");

        const username = searched_username.value.trim(); //@Verena
        // const currentUser = document.getElementById("current-user").dataset.username;
        const currentUser = document.getElementById("ladder").dataset.username;
        if (username) {
            // Vérifie si l'utilisateur essaie de s'ajouter lui-même
            if (username === currentUser) {
                showAlert("You are already your own friend ❤️");
                return;
            }
            // Appel de createListFriends pour obtenir la liste des amis
            createListFriends().then(friendsList => {
                if (isFriend(username, friendsList)) {
                    showAlert("Friend already added ❌");
                } else {
                    manageFriend("add", username);
                    // testManageFriend("add");
                    showAlert("Friend added ✅");
                }
            }).catch(error => {
                console.error('Error fetching friends list:', error);
                showAlert("Error fetching friends list");
            });
        }
        testManageFriend("add");
        searched_username.value = "";
    });

    async function fetchTemplate() {
        try {
            const response = await fetch('/chat/chat-tmp/');

            if (!response.ok)
                throw new Error('fetch chat/template : ERROR');

            const htmlContent = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            templateContactList = doc.querySelector('template[list-contact-template]');
            console.log("fetch: chat-tmp.html: success!");
        } catch (error) {
            console.error('fetch chat/template : ERROR', error);
        }
    }

    function createListFriends() {
        console.log("==createListFriends FUNCTION==");
        return fetch("getList/friends", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('fetch getList/friends : ERROR');
                }
                return response.json();
            })
            .then(data => {
                console.log('Response server _data_ : users/friends : ', data.friend_list);
                return data.friend_list.map(friend => friend.username); // Return the list of usernames
            })
            .catch(error => {
                console.error('request error: Fetch', error);
                throw error;
            });
    }

    function createListContact() {

        return new Promise((resolve, reject) => {

            console.log("==createListContact FUNCTION==");
            fetch("getList/users", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('fetch getList/users : ERROR');
                    }
                    return response.json();
                })
                .then(data => {

                    console.log('Response server _data_ : users/list : ', data.user_list);
                    // clear contact list on document
                    document.getElementById("listContact").innerHTML = "";

                    //#check#user

                    var myUsername = document.getElementById("searchInput").value;
                    data.user_list.map(user => {

                        if (myUsername != user.username) {
                            //take template
                            var tpl = templateContactList.content.cloneNode(true);
                            tpl.querySelector(".contact").id = `${user.username}-contact-id`;
                            tpl.querySelector("[data-image]").src = user.profil_picture;
                            tpl.querySelector("[data-name]").textContent = truncUsername(user.username);
                            tpl.querySelector("[data-full-name]").textContent = user.username;

                            // Set the status indicator @Verena Status
                            let statusIndicator = tpl.querySelector(".status-indicator");
                            statusIndicator.textContent = user.status;
                            statusIndicator.setAttribute('data-status', user.status);

                            // Modify the status indicator color based on status
                            if (user.status === 'online') {
                                statusIndicator.classList.add('online');
                            } else if (user.status === 'offline') {
                                statusIndicator.classList.add('offline');
                            } else if (user.status === 'playing') {
                                statusIndicator.classList.add('playing');
                            } else if (user.status === '') {
                                statusIndicator.classList.add('empty');
                            }

                            //insert contact 
                            document.getElementById("listContact").append(tpl);
                            handle_click_contact(document.getElementById("listContact").lastElementChild);
                        }

                    });
                    console.log("listContact in doc:  ", document.getElementById("listContact").innerHTML);
                    //Listen event about search
                    handle_input_steam();
                    resolve();
                    return data.friend_list.map(friend => friend.username); // Return the list of usernames not sure is usefull here
                })
                .catch(error => {
                    console.error('request error: Fetch', error);
                    reject(error);
                });
        });
    }

    function truncUsername(username) {

        if (username.length > 7) {
            username = username.substring(0, 7) + "...";
            console.log(`truncUsername: ${username}`);
        }
        return username;
    }

    function handle_click_contact(contact) {

        contact.addEventListener('click', () => {

            console.log("CLICK on CONTACT");
            const contactName = contact.querySelector("[data-full-name]").textContent;
            const img = contact.querySelector("[data-image]").src;
            //console.log(`Clic sur le contact ${contactName}. Image source: ${img}`);
            searched_username.value = contactName;
            searched_username.focus();
            document.getElementById('listContact').classList.replace("visible-profile-y", "invisible-profile-y");
            //isVisibleList = false;
        });
    }

    function handle_input_steam() {

        console.log("Handle input stream Function");
        const contacts = document.querySelectorAll('.contact');

        searchInput.addEventListener("input", function (e) {
            const value = e.target.value;
            contacts.forEach(user => {
                const name = user.querySelector("[data-name]").textContent;
                const isVisible = name.toLowerCase().includes(value.toLowerCase());
                user.classList.toggle("hide", !isVisible);
            });
        });
    }

    //test de Raph:
    function manageFriend(action, target) {

        fetch(`manageFriend/${action}/${target}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.status);
                }
                return response.json();
            })
            .then(data => {
                // test
                console.log(data.message);
            })
            .catch(error => {
                // Le traitement des erreurs ici
                console.error('Request fetch Error:', error);
            });
    }

    // Fonction pour creer et afficher une alerte personnalisée
    function showAlert(message) {
        // Crée un élément d'alerte
        var alertElement = document.createElement('div');
        alertElement.className = 'custom-alert';

        // Crée un élément pour le titre
        var titleElement = document.createElement('div');
        titleElement.className = 'alert-title';
        titleElement.textContent = 'Alert information';

        // Crée un bouton de fermeture
        var closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.className = 'close-button';
        closeButton.onclick = function () {
            document.body.removeChild(alertElement);
        };

        // Crée un élément pour le message
        var messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        // Ajoute le texte du message à l'élément de message
        var messageElement = document.createElement('div');
        messageElement.textContent = message;

        // Ajoute les éléments au DOM
        titleElement.appendChild(closeButton);
        alertElement.appendChild(titleElement);
        messageContainer.appendChild(messageElement);
        alertElement.appendChild(messageContainer);
        document.body.appendChild(alertElement);
    }

}