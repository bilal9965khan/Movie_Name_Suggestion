const GEMINI_API_KEY = 'AIzaSyD2Y4eoRZ8-5bJyKPjbSKiCTH3RruFXMoI'; // your Gemini API key
const TMDB_API_KEY = '380ec90310b21c45579c325915e9a6b8'; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3/search/movie';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w200';

document.getElementById('suggestButton').addEventListener('click', async () => {
    const userInput = document.getElementById('userInput').value;
    const industry = document.getElementById('industrySelect').value;
    if (industry === '') {
        suggestions.innerHTML = '<p class="error-message">Please select an industry (Bollywood or Hollywood).</p>';
        return;
    }
    
    const suggestions = document.getElementById('suggestions');
    suggestions.innerHTML = '';

    if (userInput.trim() === '') {
        suggestions.innerHTML = '<p class="error-message">Please enter a genre or keyword.</p>';
        return;
    }

    try {
        suggestions.innerHTML = '<p>Loading...</p>';

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Please provide a list of ${industry} movies related to: "${userInput}" in the following format:\n\n- Movie Name (Year)\n\nDo not include any additional descriptions.`
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const geminiData = await geminiResponse.json();
        const content = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            suggestions.innerHTML = '<p>No suggestions found.</p>';
            return;
        }

        const movieList = content
            .split('\n')
            .map(line => line.replace(/^- /, '').trim())
            .filter(line => line);

        suggestions.innerHTML = ''; // Clear "Loading..."
        const displayedTitles = new Set();

        for (const movieEntry of movieList) {
            const titleMatch = movieEntry.match(/^(.*?)(?:\s*\((\d{4})\))?$/);
            const movieName = titleMatch?.[1]?.trim();
            const movieYear = titleMatch?.[2];

            if (!movieName) continue;
            if (displayedTitles.has(movieName.toLowerCase())) continue;
            displayedTitles.add(movieName.toLowerCase());
            const tmdbUrl = `${TMDB_BASE_URL}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieName)}${movieYear ? `&year=${movieYear}` : ''}`;

            const tmdbRes = await fetch(tmdbUrl);
            const tmdbData = await tmdbRes.json();
            const movie = tmdbData.results?.[0];
            const overview = movie?.overview || 'No overview available.';
            const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

            const posterUrl = movie?.poster_path
                ? `${POSTER_BASE_URL}${movie.poster_path}`
                : 'https://via.placeholder.com/200x300?text=No+Image';

            const movieDiv = document.createElement('div');
            movieDiv.classList.add('movie');
            movieDiv.innerHTML = `
                <img src="${posterUrl}" alt="${movieName} poster" class="movie-poster">
                <h3>${movieName}${movieYear ? ` (${movieYear})` : ''}</h3>
                <p><strong>⭐ Rating:</strong> ${rating}</p>
                <p class="overview">${overview}</p>
            `;
            suggestions.appendChild(movieDiv);
        }

    } catch (error) {
        console.error(error);
        suggestions.innerHTML = `<p class="error-message">Error retrieving suggestions: ${error.message}</p>`;
    }
});

