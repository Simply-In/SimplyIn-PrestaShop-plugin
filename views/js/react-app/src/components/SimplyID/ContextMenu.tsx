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
import { useTranslation } from 'react-i18next';
import { TabType } from './steps/Step2';

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
	setSelectedPropertyIndex: any,
	element?: any
	selectedTab?: TabType
}
export const ContextMenu = ({ userData, element, item, setEditItemIndex, property, setUserData, selectedPropertyIndex, selectedTab, setSelectedPropertyIndex }: IContextMenu) => {
	const { t } = useTranslation();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [openDialog, setOpenDialog] = useState(false);
	const { authToken } = useContext(ApiContext);

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

		const selectedRadioItem = selectedTab ? userData?.parcelLockers.filter((el: any) => selectedTab === el.service_type).find((el: any) => el._id === element?._id) : userData[property].find((el: any) => el._id === element?._id)

		const currentlySelectedItem = selectedTab ? userData?.parcelLockers.filter((el: any) => selectedTab === el.service_type)[selectedPropertyIndex] : userData[property][selectedPropertyIndex]

		const selectedId = element?._id
		const updatedProperty = userData[property]?.filter((el: any) => {
			return el._id !== selectedId
		});

		const requestData = { userData: { ...userData, [property]: updatedProperty } }

		const handleResponse = (res: any) => {
			if (res.error) {
				throw new Error(res.error);
			}

			if (res.data) {
				const newData = { ...res.data };
				cleanUpData(newData);
				setUserData(newData);
				saveDataSessionStorage({ key: 'UserData', data: newData });
				selectPreviouslySelectedRadio(res.data);
			}
		};

		const cleanUpData = (data: any) => {
			if (data?.createdAt) {
				delete data.createdAt;
			}
			if (data?.updatedAt) {
				delete data.updatedAt;
			}
		};

		const getCustomKey = (property: any) => {
			switch (property) {
				case "parcelLockers":
					return "ParcelIndex";
				case "billingAddresses":
					return "BillingIndex";
				case "shippingAddresses":
					return "ShippingIndex";
				default:
					return null;
			}
		};

		const filterParcelLockers = (parcelLockers: any, selectedTab: any) => {
			if (selectedTab) {
				return parcelLockers.filter((el: any) => selectedTab === el.service_type);
			} else {
				return parcelLockers;
			}
		};

		const setIndex = (filteredItems: any, customKey: any, currentlySelectedItem: any) => {
			filteredItems.forEach((el: any, id: any) => {
				if (currentlySelectedItem && currentlySelectedItem._id === el._id) {
					setSelectedPropertyIndex(id);
					saveDataSessionStorage({ key: customKey, data: id });
				}
			});
		};

		const selectPreviouslySelectedRadio = (data: any) => {
			if (data[property]?.length) {
				const customKey = getCustomKey(property);
				if (!customKey) return;

				let filteredParcelLockers = filterParcelLockers(data.parcelLockers, selectedTab);
				setIndex(filteredParcelLockers, customKey, currentlySelectedItem);

				if (selectedRadioItem && !filteredParcelLockers.length) {
					setSelectedPropertyIndex(0);
					saveDataSessionStorage({ key: customKey, data: 0 });
				}
			} else {
				setSelectedPropertyIndex(null);
			}
		};

		middlewareApi({
			endpoint: "userData",
			method: 'PATCH',
			token: authToken,
			requestBody: requestData
		}).then((res: any) => {
			handleResponse(res)
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
				{property !== "parcelLockers" && <MenuItem onClick={handleEdit}><ContextMenuItemContentWrapper><EditIcon />{t('modal-step-2.edit')}</ContextMenuItemContentWrapper></MenuItem>}
				{isDeletable() && <MenuItem onClick={handleDelete}><ContextMenuItemContentWrapper><DeleteIcon /> {t('modal-step-2.delete')}</ContextMenuItemContentWrapper></MenuItem>}
			</Menu>
			<Dialog open={openDialog} onClose={handleCloseDialog}>
				<DialogTitle style={{ padding: "12px 24px" }}>
					<Stack direction="row" justifyContent="space-between">

						<DeleteItemTitle >
							{t('modal.addressDelete')}
						</DeleteItemTitle>
						<CloseContainer onClick={handleCloseDialog}>
							<CloseIcon />
						</CloseContainer>
					</Stack>
				</DialogTitle>
				<DialogContent>
					<DeleteItemText>
						{t('modal.addressDeleteConfirmation')}
					</DeleteItemText>
				</DialogContent>
				<DialogActions>
					<Button variant="outlined" color="primary" onClick={handleCloseDialog} fullWidth>{t('modal-form.cancel')}</Button>
					<Button variant="contained" color="error" onClick={handleDeleteConfirmed} fullWidth>{t('modal-step-2.delete')}</Button>
				</DialogActions>
			</Dialog>
		</div>
	)
}

export default ContextMenu