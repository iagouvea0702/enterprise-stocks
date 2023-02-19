async function variables(){
    const response = await fetch('/home/dashboard', {headers: { 'Accept': 'application/json' }})
    const datapoint = await response.json()
    queries = [datapoint.resultado, datapoint.valor]
    return queries
}

variables().then(datapoint =>{
    const tickers = datapoint[0].map(data =>{
        return data.ticker
    })

    const values = datapoint[0].map(data =>{
        return data.value
    })

    const config = {
        type: 'pie',
        data: {
            labels: tickers,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(50, 210, 40, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 165, 0, 0.2)',
                    'rgba(255, 0, 255, 0.2)',
                    'rgba(255, 255, 0, 0.2)',
                    'rgba(230, 230, 250, 0.2)',
                    'rgba(139, 69, 19, 0.2)',
                    'rgba(60, 179, 113, 0.2)',
                    'rgba(112, 128, 144, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(50, 210, 40, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 165, 0, 1)',
                    'rgba(255, 0, 255, 1)',
                    'rgba(255, 255, 0, 1)',
                    'rgba(230, 230, 250, 1)',
                    'rgba(139, 69, 19, 1)',
                    'rgba(60, 179, 113, 1)',
                    'rgba(112, 128, 144, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            title: {
                    display: true,
                    text: 'Dividendos por Fundo',
                    fontSize: 20
                },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: {
                display: false
            }
        }
        }
        var ctx = document.getElementById('myChart_weight_dividends').getContext('2d');
        var myChart = new Chart(ctx, config);
})