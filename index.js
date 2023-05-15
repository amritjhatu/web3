const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];

const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty();

  const maxPagesToShow = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(numPages, startPage + maxPagesToShow - 1);

  if (currentPage > 1) {
    $('#pagination').append(`<button class="btn btn-primary page ml-1" value="${currentPage - 1}">&laquo; Prev</button>`);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btnClass = currentPage === i ? "btn btn-primary active" : "btn btn-primary";
    $('#pagination').append(`<button class="${btnClass} page ml-1 numberedButtons" value="${i}">${i}</button>`);
  }

  if (currentPage < numPages) {
    $('#pagination').append(`<button class="btn btn-primary page ml-1" value="${currentPage + 1}">Next &raquo;</button>`);
  }
};

const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  selected_pokemons = pokemons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  $('#pokeCards').empty();
  selected_pokemons.forEach(async (pokemon) => {
    const res = await axios.get(pokemon.url);
    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${res.data.name}>
        <h3>${res.data.name.toUpperCase()}</h3>
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>
    `);
  });
};

const updateDisplayedPokemonsInfo = (currentPage, PAGE_SIZE, totalPokemons) => {
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, totalPokemons);
  $('#displayedPokemonsInfo').text(`Displaying ${start}-${end} of ${totalPokemons} Pokémon`);
};

const fetchAndDisplayTypes = async () => {
  const res = await axios.get('https://pokeapi.co/api/v2/type');
  const types = res.data.results;

  types.forEach((type) => {
    $('#typeFilter').append(`
      <div class="form-check">
        <input class="form-check-input typeCheckbox" type="checkbox" value="${type.name}" id="${type.name}">
        <label class="form-check-label" for="${type.name}">${type.name}</label>
      </div>
    `);
  });
};

const filterPokemons = async () => {
    const selectedTypes = $('.typeCheckbox:checked').map((_, checkbox) => checkbox.value).get();
  
    const filteredPokemons = (await Promise.all(pokemons.map(async (pokemon) => {
      const res = await axios.get(pokemon.url);
      const types = res.data.types.map((type) => type.type.name);
      return types.some((type) => selectedTypes.includes(type)) ? pokemon : null;
    }))).filter(pokemon => pokemon);
  
    currentPage = 1;
    const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
    paginate(currentPage, PAGE_SIZE, filteredPokemons);
    updatePaginationDiv(currentPage, numPages);
    updateDisplayedPokemonsInfo(currentPage, PAGE_SIZE, filteredPokemons.length);
  };
  

const setup = async () => {
  const response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokemons = response.data.results;
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);

  paginate(currentPage, PAGE_SIZE, pokemons);
  updatePaginationDiv(currentPage, numPages);
  updateDisplayedPokemonsInfo(currentPage, PAGE_SIZE, pokemons.length);
  fetchAndDisplayTypes();

  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName');
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    const types = res.data.types.map((type) => type.type.name);

    $('.modal-body').html(`
      <div style="width:200px">
      <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
      <div>
      <h3>Abilities</h3>
      <ul>
      ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
      </ul>
      </div>
      <div>
      <h3>Stats</h3>
      <ul>
      ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
      </ul>
      </div>
      </div>
      <h3>Types</h3>
      <ul>
      ${types.map((type) => `<li>${type}</li>`).join('')}
      </ul>
    `);
    $('.modal-title').html(`
      <h2>${res.data.name.toUpperCase()}</h2>
      <h5>${res.data.id}</h5>
    `);
  });

  $('body').on('click', '.page', async function (e) {
    currentPage = Number(e.target.value);
    paginate(currentPage, PAGE_SIZE, pokemons);
    updatePaginationDiv(currentPage, numPages);
    updateDisplayedPokemonsInfo(currentPage, PAGE_SIZE, pokemons.length);
  });

  $('body').on('change', '.typeCheckbox', filterPokemons);
};

$(document).ready(setup);