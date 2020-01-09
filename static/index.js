// Register new display name
document.addEventListener('DOMContentLoaded', function() {
      
	document.querySelector("#form").disabled = true;
	document.querySelector("#form").onkeyup = () => {
	document.querySelector("#form").disabled = false;
	}

	document.querySelector('#form').onsubmit = function() {
	    let name = document.querySelector('#name').value;
	    // Store display name in local storage
	    localStorage.setItem('displayName', name);
	};
});