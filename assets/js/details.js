function parseUrlQuery(q) {
    var res = '';
    if(location.search) {
        var pair = (location.search.substr(1)).split('&');
        for(var i = 0; i < pair.length; i ++) {
            var param = pair[i].split('=');
            if(param[0]===q)
                res = decodeURIComponent(param[1]);
        }
    }
    return res;
}

function compare(a,b) {
    if (a.tourstart < b.tourstart)
        return -1;
    if (a.tourstart > b.tourstart)
        return 1;
    return 0;
}

moment.locale('ru');

(function($){
    $(document).ready(function() {
        var ru_RU = {
            "processing": "Подождите...",
            "search": "Поиск:",
            "lengthMenu": "Показать _MENU_ записей",
            "info": "Записи с _START_ до _END_ из _TOTAL_ записей",
            "infoEmpty": "Записи с 0 до 0 из 0 записей",
            "infoFiltered": "(отфильтровано из _MAX_ записей)",
            "infoPostFix": "",
            "loadingRecords": "Загрузка записей...",
            "zeroRecords": "Записи отсутствуют.",
            "emptyTable": "Нет данных",
            "paginate": {
                "first": "Первая",
                "previous": "Назад",
                "next": "Вперёд",
                "last": "В конец"
            },
            "aria": {
                "sortAscending": ": активировать для сортировки столбца по возрастанию",
                "sortDescending": ": активировать для сортировки столбца по убыванию"
            }
        };

        function renderIFF() {
            var shipid = parseUrlQuery('ship');
            var tourid = parseUrlQuery('tour');
            let cruise_url = 'https://restapi.infoflot.com/cruises/' + tourid + '?key=407c8c353a23a14d40479eb4e4290a8a6d32b06b';
            let ship_url = 'https://restapi.infoflot.com/ships/' + shipid + '?key=407c8c353a23a14d40479eb4e4290a8a6d32b06b';
            let cabins_url = 'https://restapi.infoflot.com/cruises/' + tourid + '/cabins?key=407c8c353a23a14d40479eb4e4290a8a6d32b06b';
            const dataSet = [];
            $.when($.getJSON(ship_url), $.getJSON(cabins_url)).done(function (ships, cabs) {
                var shipdata = ships[0];
                var cab = cabs[0];
                $('.shipname').html('<hr><h2>т/х "' + shipdata['name'] + '"</h2>');
                $("title").text('Круиз т.х. ' + shipdata['name']);
                $("input[name='ship']").val(shipdata['name']);
                $('.shipimg').html('<img src="' + shipdata['files']['photo']['path'] + '" width="350" />');
                $('.deckplan').html('<a href="' + shipdata['files']['scheme']['path'] + '" data-lightbox="deckplan"><img src="' + shipdata['files']['scheme']['path'] + '" width="350" /></a>');
                $('.description').html('<p><br><br>' + shipdata['descriptionBig'] + '</p>');

                var types = [];
                var co = 0;
                var typePrice = {};
                $.each(cab.prices, function(x, price){
                    typePrice[x] = price.prices.main_bottom.adult;
                });

                var imgsrc = 'https://placehold.it/150x150';

                $.each(shipdata['cabins'], function (i, v){

                    if(types.indexOf(v.typeId) === -1) {
                        types.push(v.typeId);
                        dataSet[co] = {};
                        var tr = '<tr><td>';

                        if(v['photos']) {
                            imgsrc =  v['photos'].length > 0 ? v['photos'][0]['filename'] : 'https://placehold.it/150x150';
                        }
                        var image = '<img src="' + imgsrc + '" width="150">';
                        dataSet[co]['imgsrc'] = imgsrc;
                        dataSet[co]['name'] = v['typeName'];
                        var desc = v['typeFriendlyName'] === null ? '' : v['typeFriendlyName'];
                        dataSet[co]['desc'] = v['typeFriendlyName'] === null ? '' : v['typeFriendlyName'];
                        var price = typePrice[v.typeId].toString();
                        dataSet[co]['price'] = typePrice[v.typeId].toString();
                        tr = tr + image + '</td><td>' + v['typeName'] + '</td><td>' + desc + '</td><td>' + price + '</td></tr>';
                        $('#tourcabins').append(tr);
                        co++;
                    }
                });
            });

            $.getJSON(cruise_url)
                .done(function (data) {
                    //console.log(data);
                    $('.cruise-meta').append('<li>' + data['route'] + '</li>').append('<li>Дата круиза: ' + moment(data['dateStart'], 'YYYY-MM-DDTHH:mm:ss+03:00').format('YYYY-MM-DD HH:mm') + ' - ' + moment(data['dateEnd'], 'YYYY-MM-DDTHH:mm:ss+03:00').format('YYYY-MM-DD HH:mm') + ' ( ' + data['days'] + ' дн.)' + ' </li>');
                    $("input[name='tour']").val(data['route']);
                    $("meta[name='description']").attr('content', 'Круиз: ' +  data['route']);
                    $("input[name='date']").val(data['dateStart'] );
                    const dataSet = [];
                    let ex = '';

                    if (data['timetable'] && data['timetable'].length > 0) {
                        $.each(data['timetable'], function (i, v){
                            dataSet[i] = {};
                            dataSet[i]['city'] = v['place'];
                            dataSet[i]['date_start'] = moment(v['dateArrival'], 'YYYY-MM-DDTHH:mm:ss+03:00').format('YYYY-MM-DD HH:mm');
                            dataSet[i]['date_end'] = moment(v['dateDeparture'], 'YYYY-MM-DDTHH:mm:ss+03:00').format('YYYY-MM-DD HH:mm');
                            dataSet[i]['description'] = v['description'] === null ? '' : v['description'];
                        });
                        //console.log(dataSet);
                        $.each(dataSet, function (id, row) {
                            ex = '<tr><td width="100">' + row.city + '</td>' +
                                '<td width="120">' + row.date_start + '</td>' +
                                '<td width="120">' + row.date_end + '</td>' +
                                '<td>' + row.description + '</td></tr>';
                            $('#program').append(ex);
                        });
                    } else {
                        // ex = '<tr><td colspan="3"><a href="' + data['timetableDoc'] + '">Программа круиза</a></td>';
                        // $('#program').append(ex);
                    }
                });
        }


        function renderDetailsVDH() {
            var shipid = parseUrlQuery('ship');
            var tourid = parseUrlQuery('tour');
            var ships_url = '/api/ajax/vodohod/motorships.json';//'https://api.vodohod.com/json/v2/motorships.php?pauth=';
            var tour_url = '/api/ajax/vodohod/' + shipid + '/' + tourid + '.json';


            $.getJSON(ships_url)
                .done(function (data) {
                    $('.shipname').html('<hr><h2>т/х "' + data[shipid]['name'] + '"</h2>');
                    $("title").text('Круиз ' + tourid + ' т.х. ' + data[shipid]['name']);
                    $("input[name='ship']").val(data[shipid]['name']);
                    $('.shipimg').html('<img src="/assets/img/vdh/'+ data[shipid]['code'] + '.jpg" width="550" />');
                    $('.deckplan').html('<a href="' + data[shipid]['decks'] + '" data-lightbox="deckplan"><img src="' + data[shipid]['decks'] + '" width="350" /></a>');
                    $('.description').html( data[shipid]['description']);
                });

            $.getJSON(tour_url)
                .done(function (tours) {
                    $('.cruise-meta').append('<li>' + tours['name'] + '</li>').append('<li>Дата круиза: ' + moment(tours['dateStart']).format('DD.MM.YYYY') + ' - ' + moment(tours['dateStop']).format('DD.MM.YYYY') + ' ( ' + tours['days'] + ' дн.)' + ' </li>');
                    $("input[name='tour']").val(tours['name']);
                    $("meta[name='description']").attr('content', 'Круиз: ' +  tours['name']);
                    $("input[name='date']").val(tours['dateStart']);
                    $.each(tours.tariffs[0].prices, function (id, row) {
                        var available = row.hasOwnProperty('available') === true ? row['available'] : '0';
                        var cabins_table = '<tr>' +
                            '<td>' + row['price_name'] + '</td>' +
                            '<td>' + row['rt_name'] + '</td>' +
                            '<td>' + row['rp_name'] + '</td>' +
                            '<td>' + row['price_value'] + '</td>' +
                            '<td>' + available + '</td>' +
                            '</tr>';
                        $('#tourcabins').append(cabins_table);
                    });
                    var ex = '';
                    $.each(tours.routeDays, function (id, row) {
                        ex = '<tr><td width="100">' + row.portName + '</td>' +
                            '<td width="120">' + row.timeStart.substr(0, 5) + '</td>' +
                            '<td width="120">' + row.timeStop.substr(0, 5) + '</td>' +
                            '<td>' + row.excursionHtml + '</td></tr>';
                        $('#program').append(ex);
                    });


                });//end tours callback
        }



        var com = parseUrlQuery('com');
        switch(com){
            case 'vdh':
                renderDetailsVDH();
                break;
            case 'inf':
                renderIFF();
                break;
            default:
                break;
        }

    });
})(jQuery);
