import { Button, Grid } from '@mui/material'


interface IEditFormFooter {
	isNewData: any,
	handleCancel: any
}



export const EditFormFooter = ({ isNewData, handleCancel }: IEditFormFooter) => {

	return (
		<Grid container spacing={2} style={{
			position: "sticky",
			padding: "0 0px 8px",
			background: "white",
			bottom: "0px",
			zIndex: "10",
			left: 0,
			borderTop: "1px solid #F1F7FF"
		}}>
			<Grid item xs={6} >
				<Button variant="outlined" fullWidth onClick={handleCancel} style={{
					fontFamily: 'Inter, sans-serif',
					padding: "6px 16px",
					borderRadius: "4px",
					backgroundColor: "transparent",
					border: "1px solid rgba(25, 118, 210, 0.5)",
					color: "rgb(25, 118, 210)"

				}}  >Anuluj</Button>
			</Grid>
			<Grid item xs={6} >
				<Button type="submit" variant="contained" color="primary" fullWidth
					style={{
						fontFamily: 'Inter, sans-serif',
						color: "white",
						padding: "6px 16px",
						borderRadius: "4px",
						backgroundColor: "rgb(25, 118, 210)"

					}}>
					{isNewData ? "Dodaj" : "Zapisz"}
				</Button>
			</Grid>
		</Grid>
	)
}
