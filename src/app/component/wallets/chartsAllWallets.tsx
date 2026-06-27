'use client'
import type { ApexOptions } from 'apexcharts'
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const ChartAllWallets = () => {
    const series = [100000, 50000, 25000]
    const options: ApexOptions = {
        chart: {
            height: 350,
            type: 'radialBar',
        },
        plotOptions: {
            radialBar: {
                dataLabels: {
                    name: {
                        fontSize: '22px',
                    },
                    value: {
                        fontSize: '16px',
                    },
                    total: {
                        show: true,
                        label: 'Total Balance',
                        formatter: function () {
                            return '175000'
                        }
                    }
                }
        }
        },
        labels: ['Wallet 1', 'Wallet 2', 'Wallet 3'],
    }

    return (
        <Chart 
        options={options} 
        series={series} />
    )
}

export default ChartAllWallets
