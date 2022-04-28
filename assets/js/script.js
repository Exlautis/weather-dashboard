// Api key 
const APIKey = '&appid=e3a1e9a8560408db982fd772547dac9c';
var citySearch;
var weatherAPI = 'https://api.openweathermap.org/data/2.5/weather?';
var uviAPI = 'https://api.openweathermap.org/data/2.5/uvi?lat=';
var forecastAPI = 'https://api.openweathermap.org/data/2.5/forecast?q=';
var units = '&units=imperial';
var getWeatherIcon = 'http://openweathermap.org/img/wn/';
var searchHistoryArr = [];


$(document).ready(function() {
    init();

    function init() {
        search();
        $('#current-forecast').hide();
        $('#five-day-forecast-container').hide();
        $('#search-history-container').hide();
        $('#error-div').hide();
        displayHistory();
        clearHistory();
        clickHistory();
    }

    //Search City
    function search() {
        $('#search-button').on('click', function() {
            citySearch = $('#search-input')
            .val()
            .trim();

            if (citySearch === '') {
                return;
            }
            $('#search-input').val('');
            getWeather(citySearch);
        });
    }

    function getWeather(search) {
        var queryURL = weatherAPI + 'q=' + search + units + APIKey;
        $.ajax({
            url: queryURL,
            method: 'GET',
            statusCode: {
                404: function() {
                    $('#current-forecast').hide();
                    $('#five-day-forcast-container').hide();
                    $('#error-div').show();
                }
            }
        }).then(function(response) {
            $('#error-div').hide();
            $('#current-forecast').show();
            $('#five-day-forecast-container').show();

            var results = response;
            var name = results.name;
            var temperature = Math.floor(results.main.temp);
            var humidity = results.main.humidity;
            var windSpeed = results.wind.speed;
            var date = new Date(results.dt * 1000).toLocaleDateString('en-US');
            var weatherIcon = results.weather[0].icon;
            var weatherIconURL = getWeatherIcon + weatherIcon + '.png';

            // Store history
            storeHistory(name);
            $('#city-name').text(name + ' (' + date + ') ');
            $('#weather-image').attr('src', weatherIconURL);
            $('#temperature').html('<b>Temperature: </b>' + temperature + ' °F');
            $('#humidity').html('<b>Humidity: </b>' + humidity + '%');
            $('#wind-speed').html('<b>Wind Speed: </b>' + windSpeed + ' MPH');

            var lat = response.coord.lat;
            var lon = response.coord.lon;
            var uviQueryURL = uviAPI + lat + '&lon=' + lon + APIKey;

            $.ajax({
                url: uviQueryURL,
                method: 'GET'
            }).then(function(uviResponse) {
                var uviResults = uviResponse;
                var uvi = uviResults.value;
                $('#uv-index').html(
                    '<b>UV Index </b>' + '<span class="badge badge-pill badge-light" id="uvi-badge">' + uvi + '</span>' 
                );

                // if statements for UVI
                if (uvi < 3) {
                    $('#uvi-badge').css('background-color', 'green');
                } else if (uvi < 6) {
                    $('#uvi-badge').css('background-color', 'yellow');
                } else if (uvi < 8) {
                    $('#uvi-badge').css('background-color', 'orange');
                } else if (uvi < 11) {
                    $('#uvi-badge').css('background-color', 'red');
                } else {
                    $('#uvi-badge').css('background-color', 'purple');
                }
            });

            var cityName = name;
            var countryCode = response.sys.country;
            var forecastQueryURL = forecastAPI + cityName + ',' + countryCode + units+ APIKey;

            $.ajax({
                url: forecastQueryURL,
                method: 'GET'
            }).then(function(forecastResponse) {
                var forecastResults = forecastResponse;
                var forecastArr = [];

                for (var i = 5; i < 40; i += 8) {
                    var forecastObj = {};
                    var forecastResultsDate = forecastResults.list[i].dt_txt;
                    var forecastDate = new Date(forecastResultsDate).toLocaleDateString('en-US');
                    var forecastTemp = forecastResults.list[i].main.temp;
                    var forecastHumidity = forecastResults.list[i].main.humidity;
                    var forecastIcon = forecastResults.list[i]. weather[0].icon;

                    forecastObj['list'] = {};
                    forecastObj['list']['date'] = forecastDate;
                    forecastObj['list']['temp'] = forecastTemp;
                    forecastObj['list']['humidity'] = forecastHumidity;
                    forecastObj['list']['icon'] = forecastIcon;

                    forecastArr.push(forecastObj);
                }
                
                for (var i = 0; i < 5; i++) {
                    var forecastArrDate = forecastArr[i].list.date;
                    var forecastIconUrl = getWeatherIcon + forecastArr[i].list.icon + '.png';
                    var forecastArrTemp = Math.floor(forecastArr[i].list,temp);
                    var forecastArrHumidity = forecastArr[i].list.humidity;

                    $('#date-' + (i + 1)).text(forecastArrDate);
                    $('#weather-image-' + (i + 1)).attr('src', forecastIconUrl);
                    $('#temp-' + (i + 1)).text('Temp: ' + forecastArrTemp + ' °F');
                    $('#humidity-' + (i + 1)).text('humidity' + forecastArrHumidity + '%');

                }
                $('#weather-container').show();
            });
        });
    }

    // store history()
    function storeHistory(citySearchName) {
        var searchHistoryObj = {};

        if (searchHistoryArr.length === 0) {
            searchHistoryObj['city'] = citySearchName;
            searchHistoryArr.push(searchHistoryObj);
            localStorage.setItem('searchHistory', JSON.stringify(searchHistoryArr));
        } else {
            var checkHistory = searchHistoryArr.find(
                ({ city }) => city === citySearchName
            );

            if (searchHistoryArr.length < 5) {
                if (checkHistory === undefined) {
                    searchHistoryObj['city'] = citySearchName
                    searchHistoryArr.push(searchHistoryObj);
                    localStorage.setItem(
                        'searchHistory',
                        JSON.stringify(searchHistoryArr)
                    );
                }
            } else {
                if (checkHistory === undefined) {
                    searchHistoryArr.shift();
                    searchHistoryObj['city'] = citySearchName;
                    searchHistoryArr.push(searchHistoryObj);
                    localStorage.setItem(
                        'searchHistory',
                        JSON.stringify(searchHistoryArr)
                    );
                }
            }
        } 
        $('#search-history').empty();
        displayHistory();
    }

    function displayHistory() {
        var getLocalSearchHistory = localStorage.getItem('searchHistory');
        var localSearchHistory = JSON.parse(getLocalSearchHistory);
    
        if (getLocalSearchHistory === null) {
          createHistory();
          getLocalSearchHistory = localStorage.getItem('searchHistory');
          localSearchHistory = JSON.parse(getLocalSearchHistory);
        }
    
        for (var i = 0; i < localSearchHistory.length; i++) {
          var historyLi = $('<li>');
          historyLi.addClass('list-group-item');
          historyLi.text(localSearchHistory[i].city);
          $('#search-history').prepend(historyLi);
          $('#search-history-container').show();
        }
        return (searchHistoryArr = localSearchHistory);
    }

    function displayHistory() {
        var getLocalSearchHistory = localStorage.getItem('searchHistory');
        var localSearchHistory = JSON.parse(getLocalSearchHistory);

        if (getLocalSearchHistory === null) {
            createHistory();
            getLocalSearchHistory = localStorage.getItem('searchHistory');
            localSearchHistory = JSON.parse(getLocalSearchHistory);
        }

        for (var i = 0; i < localSearchHistory.length; i++) {
            var historyLi = $('<li>');
            historyLi.addClass('list-group-item');
            historyLi.text(localSearchHistory[i].city);
            $('#search-history').prepend(historyLi);
            $('#search-history-container').show();
        }
        return (searchHistoryArr = localSearchHistory);
    }

    function createHistory() {
        searchHistoryArr.length = 0;
        localStorage.setItem('searchHistory', JSON.stringify(searchHistoryArr));
    }

    function clearHistory() {
        $('#clear-button').on('click', function() {
            $('#search-history').empty();
            $('#search-history-container').hide();
            localStorage.removeItem('searchHistory');
            createHistory();
        });
    }

    function clickHistory() {
        $('#search-history').on('click', li, function() {
            var cityNameHistory = $(this).text();
            getWeather(cityNameHistory);
        });
    }

});