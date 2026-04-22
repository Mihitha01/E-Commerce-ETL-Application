import pandas as pd

def extract_data(file_path="data/Amazon Sale Report.csv"):
	columns = [
		"Order ID",
		"Date",
		"Status",
		"SKU",
		"Category",
		"Qty",
		"Amount",
		"ship-city",
		"ship-state",
		"promotion-ids",
	]
	df = pd.read_csv(file_path, usecols=columns, dtype=str, low_memory=True)
	return df


