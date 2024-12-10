// Kostengruppensuche
// mittels "fuse.js" (fuzzy search)

const searchInput = document.getElementById("search");
const resultsContainer = document.getElementById("results");
const clearBtn = document.getElementById("clear-btn");

let fuse; // Fuse.js instance
let groups = [];

// Function to strip comments from JSON
function stripJsonComments(jsonString) {
	return jsonString.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();
}

// Load groups and initialize Fuse.js
fetch("groups.json")
	.then(response => response.text())
	.then(text => JSON.parse(stripJsonComments(text)))
	.then(data => {
		groups = data;

		// Configure Fuse.js options
		const options = {
			keys: ["id", "name", "tags"], // Fields to search
			threshold: 0.32, // Adjust for fuzziness
			includeMatches: true, // Include match information for highlighting
			useExtendedSearch: true, // Enable extended search to handle diacritics
		};

		fuse = new Fuse(groups, options);
	})
	.catch(error => {
		console.error("Oopsie! Error fetching groups:", error);
	});

// Filter and display results
searchInput.addEventListener("input", () => {
	const query = searchInput.value.normalize("NFC"); // Normalize input
	const results = fuse.search(query);

	// Show the clear button if there's text
	clearBtn.style.display = query ? "inline" : "none";

	// Render results with highlights
	displayResults(results, query);
});

// Clear the search input and results when the clear button is clicked
clearBtn.addEventListener("click", () => {
	searchInput.value = "";
	clearBtn.style.display = "none";
	resultsContainer.innerHTML = ""; // Clear results
});

function displayResults(results, query) {
	resultsContainer.innerHTML = results
		.map(result => {
			const { item, matches } = result;

			const unit = item.unit ? item.unit : ""
			const type = item.type ? item.type : ""
			// Highlight fields
			const id = highlightMatch(item.id, matches, "id");
			const name = highlightMatch(item.name, matches, "name");
			const tags = item.tags
				.map(tag => {
					// Check if this specific tag matches
					const tagMatch = matches.find(
						m => m.key === "tags" && m.value === tag
					);
					return highlightMatch(tag, tagMatch ? [tagMatch] : null, "tags");
				})
				.join(", ");

			return `<li>
						<div><h2><span class="kgnr">${id}</span> ${name}</h2>${tags}</div>
						${unit ? `
							<div>
							<span class="unit">${unit}</span><span class="arrow"> → </span> 
							<span class="type">${type}</span>
							</div>` : ''}
					</li>`;
		})
		.join("");
}

function highlightMatch(text, matches, key) {
	if (!matches) return text;

	const match = matches.find(m => m.key === key);
	if (!match) return text;

	let highlightedText = text;
	match.indices
		.reverse()
		.forEach(([start, end]) => {
			// Only highlight if the match length is greater than 1
			if (end - start >= 1) {
				highlightedText =
					highlightedText.slice(0, start) +
					`<span class="highlight">${highlightedText.slice(start, end + 1)}</span>` +
					highlightedText.slice(end + 1);
			}
		});

	return highlightedText;
}
