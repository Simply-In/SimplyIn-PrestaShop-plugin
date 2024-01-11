import { useState, useContext } from 'react'

import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import styled from 'styled-components';
import { EditIcon } from '../../assets/EditIcon';
import { DeleteIcon } from '../../assets/DeleteIcon';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { Stack } from '@mui/material';
import { CloseIcon } from '../../assets/CloseIcon';
import { CloseContainer, DeleteItemTitle, DeleteItemText } from '../SimplyID/SimplyID.styled';
import { middlewareApi } from '../../services/middlewareApi';
import { ApiContext } from '../SimplyID/SimplyID';
import { saveDataSessionStorage } from '../../services/sessionStorageApi';

const ContextMenuWrapper = styled.div`
cursor:pointer;
`

const ContextMenuItemContentWrapper = styled.div`
display:flex;
justify-content: flex-start;
align-items: center;
gap: 10px;
width: 100%;
color: #3167B9;
&:hover{
	// color:red;
}

`

const PropertyNameOptions = ["billingAddresses", "shippingAddresses", "parcelLockers"] as const;
type PropertyName = typeof PropertyNameOptions[number];

interface IContextMenu {
	item: number
	setEditItemIndex: (arg: { property: PropertyName, itemIndex: number } | null) => void
	property: PropertyName
	setUserData: any
	userData: any
	selectedPropertyIndex: any
	setSelectedPropertyIndex: any
}
export const ContextMenu = ({ userData, item, setEditItemIndex, property, setUserData, selectedPropertyIndex, setSelectedPropertyIndex }: IContextMenu) => {

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [openDialog, setOpenDialog] = useState(false);
	const apiToken = useContext(ApiContext);

	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};


	const handleEdit = () => {
		setEditItemIndex({ property: property, itemIndex: item })
		handleClose()
		console.log('edit', item);
	}


	const handleDelete = () => {
		handleOpenDialog();
	};


	const handleOpenDialog = () => {
		setOpenDialog(true);
	};

	const handleCloseDialog = () => {
		setOpenDialog(false);
	};

	const handleDeleteConfirmed = () => {

		const selectedRadioItem = userData[property].find((el: any) => el._id === userData[property][selectedPropertyIndex]?._id) || null

		const selectedId = userData[property][item]._id
		const updatedProperty = userData[property]?.filter((el: any) => {
			return el._id !== selectedId
		});


		const requestData = { ...userData, [property]: updatedProperty }

		middlewareApi({
			endpoint: "userData",
			method: 'PATCH',
			token: apiToken,
			requestBody: requestData
		}).then(res => {
			console.log(res);
			if (res.error) {
				throw new Error(res.error)
			} else if (res.data) {
				setUserData(res.data)
				saveDataSessionStorage({ key: 'UserData', data: res.data })
				//selection of previously selected radio element
				if (res.data[property].length) {
					const filteredPropertyArray = res.data[property].filter((el: any, id: number) => {
						if (selectedRadioItem && el._id === selectedRadioItem._id) {
							setSelectedPropertyIndex(id)
						}
						return el._id === selectedRadioItem?._id
					})

					if (selectedRadioItem && !filteredPropertyArray.length) {
						console.log('no length', filteredPropertyArray);
						setSelectedPropertyIndex(0)

					}
				} else {
					setSelectedPropertyIndex(null)
				}
			}
		})

		handleCloseDialog();
		handleClose();
	};
	const isDeletable = () => {
		if (property !== "billingAddresses") { return true }
		if (userData?.billingAddresses.length === 1) return false
		return true
	}
	return (
		<div>
			<ContextMenuWrapper onClick={handleClick}>
				<MoreVertIcon />
			</ContextMenuWrapper>

			<Menu
				id="basic-menu"
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{
					'aria-labelledby': 'basic-button',
				}}
			>
				<MenuItem onClick={handleEdit}><ContextMenuItemContentWrapper><EditIcon />Edytuj</ContextMenuItemContentWrapper></MenuItem>
				{isDeletable() && <MenuItem onClick={handleDelete}><ContextMenuItemContentWrapper><DeleteIcon /> Usuń</ContextMenuItemContentWrapper></MenuItem>}
			</Menu>
			<Dialog open={openDialog} onClose={handleCloseDialog}>
				<DialogTitle style={{ padding: "12px 24px" }}>
					<Stack direction="row" justifyContent="space-between">

						<DeleteItemTitle >
							Usuwanie adresu
						</DeleteItemTitle>
						<CloseContainer onClick={handleCloseDialog}>
							<CloseIcon />
						</CloseContainer>
					</Stack>
				</DialogTitle>
				<DialogContent>
					<DeleteItemText>
						Czy na pewno chcesz usunąc ten adres?
					</DeleteItemText>
				</DialogContent>
				<DialogActions>
					<Button variant="outlined" color="primary" onClick={handleCloseDialog} fullWidth>Anuluj</Button>
					<Button variant="contained" color="error" onClick={handleDeleteConfirmed} fullWidth>Usuń</Button>
				</DialogActions>
			</Dialog>
		</div>
	)
}

export default ContextMenu