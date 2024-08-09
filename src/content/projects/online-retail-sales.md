---
title: Online retail sales analysis
description: Analysis of sales data from an online retail business
publishDate: 'Aug 8 2024'
isFeatured: true
seo:
  image:
    # src: 'placeholder.png'
    src: 'project_online-retail-sales/online_retail_sales_preview.jpg'
---

![Project preview](/project_online-retail-sales/online_retail_sales_preview.jpg)

**Project overview:**
In this project I analyze a dataset of the sales for an online retail company over two years. I use SQL to retrieve specific information that will be useful for analysis purposes, and then I identify some trends in the sales data and create a dashboard in Power BI for visualization. I show most of the whole process rather than only presenting the results.

This project was my first encounter with SQL and Power BI. I used a combination of online tutorials, documentation, and ChatGPT for learning these tools. I used ChatGPT extensively (and shamelessly 😇) for creating SQL queries as well as for understanding how they worked, to speed up the query writing and the learning process.

This project was done on a PC running Windows. The software I used was the following:
- For setting up a local SQL server: *SQL Server 2022 Configuration Manager*
- For querying the SQL database: *Microsoft SQL Server Management Studio 19* (SSMS)
- For data visualization: *Microsoft Power BI*



## The data set

This dataset includes all transactions for a UK-based online retail company, operating without a physical store, from December 2009 to December 2011. The company specializes in giftware. Many of its customers are wholesalers.

I found the dataset at Kaggle, provided by the user Lakshmipathi N. (<a class="link" href="https://www.kaggle.com/datasets/lakshmi25npathi/online-retail-dataset">link</a>). Primary source of the dataset: Dr. Daqing Chen, Course Director: M.Sc. Data Science, School of Engineering, London South Bank University.



## Data exploration

<!-- show some of the table -->
Importing the two data sheets (2009-2010 and 2010-2011) into SSMS:
![Importing data into SSMS](/project_online-retail-sales/img1.png)


Description of the columns of the data set:
- Invoice: A 6-digit code uniquely assigned to each transaction. If the code starts with the letter 'C', it indicates a cancellation.
- StockCode: Product code. 
- Description: Product name. 
- Quantity: The quantities of each product per transaction.
- InvoiceDate: Invoice date and time. 
- Price: Product price per unit in British pounds (£).
- CustomerID: A 5-digit number uniquely assigned to each customer.
- Country: The name of the country where the customer lives.

The data consists of two data sheets, roughly one year of sales data each. The total number of rows in tables 1 and 2 is 525 461 and 541 910 respectively. 

Now jumping into some SQL querying for data exploration. For a quick overview, selecting the first rows of one of the tables:

```sql
SELECT TOP (1000) [Invoice]
       ,[StockCode]
       ,[Description]
       ,[Quantity]
       ,[InvoiceDate]
       ,[Price]
       ,[Customer_ID]
       ,[Country]
FROM [SalesDataAnalysis].[dbo].[online_retail_II_2009-2010]
```

which results in this output table (only part of it is shown here):

![Top rows of one of the data tables](/project_online-retail-sales/img2-2.png)


Checking for null values in both tables: 

```sql
SELECT *
FROM sales_2009_2010
WHERE
    Invoice IS NULL OR
    StockCode IS NULL OR
    Description IS NULL OR
    Quantity IS NULL OR
    InvoiceDate IS NULL OR
    Price IS NULL OR
    Customer_ID IS NULL OR
    Country IS NULL
ORDER BY Description;

SELECT *
FROM sales_2010_2011
WHERE
    Invoice IS NULL OR
    StockCode IS NULL OR
    Description IS NULL OR
    Quantity IS NULL OR
    InvoiceDate IS NULL OR
    Price IS NULL OR
    Customer_ID IS NULL OR
    Country IS NULL
ORDER BY Description;
```

Which gives the following output:
![Null values](/project_online-retail-sales/img3.png)


Now, counting the number of null values for different columns:
```sql
SELECT 
    COUNT(CASE WHEN Invoice IS NULL THEN 1 END) AS Null_Invoices,
    COUNT(CASE WHEN StockCode IS NULL THEN 1 END) AS Null_StockCodes,
    COUNT(CASE WHEN Description IS NULL THEN 1 END) AS Null_Descriptions,
    COUNT(CASE WHEN Quantity IS NULL THEN 1 END) AS Null_Quantities,
    COUNT(CASE WHEN InvoiceDate IS NULL THEN 1 END) AS Null_InvoiceDates,
    COUNT(CASE WHEN Price IS NULL THEN 1 END) AS Null_Prices,
    COUNT(CASE WHEN Customer_ID IS NULL THEN 1 END) AS Null_Customer_IDs,
    COUNT(CASE WHEN Country IS NULL THEN 1 END) AS Null_Countries
FROM 
    sales_2009_2010;

SELECT 
    COUNT(CASE WHEN Invoice IS NULL THEN 1 END) AS Null_Invoices,
    COUNT(CASE WHEN StockCode IS NULL THEN 1 END) AS Null_StockCodes,
    COUNT(CASE WHEN Description IS NULL THEN 1 END) AS Null_Descriptions,
    COUNT(CASE WHEN Quantity IS NULL THEN 1 END) AS Null_Quantities,
    COUNT(CASE WHEN InvoiceDate IS NULL THEN 1 END) AS Null_InvoiceDates,
    COUNT(CASE WHEN Price IS NULL THEN 1 END) AS Null_Prices,
    COUNT(CASE WHEN Customer_ID IS NULL THEN 1 END) AS Null_Customer_IDs,
    COUNT(CASE WHEN Country IS NULL THEN 1 END) AS Null_Countries
FROM 
    sales_2010_2011;
```

![Number of null values in each column in the two tables](/project_online-retail-sales/img4.png)

We see that there are the most null values in the CustomerID column, with 107927 null values and 135080 null values in the first and second tables respectively (20-25% of the total amount of rows). There is also a notable amount of null values in the Description column, with 2928 null values and 1454 null values in the first and second tables respectively. <!-- There is also a notable amount of null values in the Description column, with 2928 null values (≈0.5% of the rows) and 1454 null values (≈0.25% of the rows) in the first and second tables respectively.  -->
The CustomerID nulls could maybe be due to guest checkouts, data entry errors or some account privacy settings. I'm more uncertain about the description nulls, but one possibility is that their product listings are incomplete. Potentially that they have added items to their online store without having added descriptions for those items yet. 


Further exploration: Counting positive, zero and negative values for Price and Quantity:
```sql
SELECT
    positivePrices,
	zeroPrices,
	negativePrices,

	positiveQuantity,
	zeroQuantity,
	negativeQuantity,

    max_rowID
FROM (
    SELECT
        COUNT(CASE WHEN Price > 0 THEN 1 END) AS positivePrices,
		COUNT(CASE WHEN Price = 0 THEN 1 END) AS zeroPrices,
		COUNT(CASE WHEN Price < 0 THEN 1 END) AS negativePrices,

		COUNT(CASE WHEN Quantity > 0 THEN 1 END) AS positiveQuantity,
		COUNT(CASE WHEN Quantity = 0 THEN 1 END) AS zeroQuantity,
		COUNT(CASE WHEN Quantity < 0 THEN 1 END) AS negativeQuantity,

        MAX(rowID) AS max_rowID
    FROM
        [SalesDataAnalysis].[dbo].[sales_2009_2010]
) AS subquery;


SELECT
    positivePrices,
	zeroPrices,
	negativePrices,

	positiveQuantity,
	zeroQuantity,
	negativeQuantity,

    max_rowID
FROM (
    SELECT
        COUNT(CASE WHEN Price > 0 THEN 1 END) AS positivePrices,
		COUNT(CASE WHEN Price = 0 THEN 1 END) AS zeroPrices,
		COUNT(CASE WHEN Price < 0 THEN 1 END) AS negativePrices,

		COUNT(CASE WHEN Quantity > 0 THEN 1 END) AS positiveQuantity,
		COUNT(CASE WHEN Quantity = 0 THEN 1 END) AS zeroQuantity,
		COUNT(CASE WHEN Quantity < 0 THEN 1 END) AS negativeQuantity,

        MAX(rowID) AS max_rowID
    FROM
        [SalesDataAnalysis].[dbo].[sales_2010_2011]
) AS subquery;
```

![Number of positive, zero and negative values for Price and Quantity](/project_online-retail-sales/img5.png)

The negative Quantity values seem to correspond to cancellations in most or all cases. 

In some cases it will be useful to have only entries with positive Quantity. This filters out cancellations.
```sql
SELECT *
INTO [SalesDataAnalysis].[dbo].[sales_2009_2010_filtered]
FROM [SalesDataAnalysis].[dbo].[sales_2009_2010]
WHERE Quantity > 0;

SELECT *
INTO [SalesDataAnalysis].[dbo].[sales_2010_2011_filtered]
FROM [SalesDataAnalysis].[dbo].[sales_2010_2011]
WHERE Quantity > 0;
```


Further exploration: Finding the number of unique invoice numbers for each year. For this I use the filtered list without the cancellations.
```sql
SELECT COUNT(DISTINCT Invoice) AS "Total unique invoices 2009-2010"
FROM [SalesDataAnalysis].[dbo].[sales_2009_2010_filtered];

SELECT COUNT(DISTINCT Invoice) AS "Total unique invoices 2010-2011"
FROM [SalesDataAnalysis].[dbo].[sales_2010_2011_filtered];
```
![Number of unique invoices](/project_online-retail-sales/img6.png)

Note that these results are not exact representations of the number of invoices in the two years, as there is some days of overlap between the data sheets of the first and second year. These queries are mainly to get a rough overview of the data.


## Data cleaning

The overlap between the two data tables is a bit inconvenient. It can be seen here:
```sql
SELECT * FROM [SalesDataAnalysis].[dbo].[sales_2009_2010_filtered]
ORDER BY InvoiceDate, StockCode;

SELECT * FROM [SalesDataAnalysis].[dbo].[sales_2010_2011_filtered]
ORDER BY InvoiceDate, StockCode;
```
![Tables overlap](/project_online-retail-sales/img7-2.png)
Here I have navigated to the overlap area. The overlap begins toward the end of the first table and from the first row of the second table. Now I merge the two tables into a single table in order to avoid overcounting items/orders.
```sql
SELECT
    COALESCE(a.Invoice, b.Invoice) AS Invoice,
    COALESCE(a.StockCode, b.StockCode) AS StockCode,
    COALESCE(a.Description, b.Description) AS Description,
    COALESCE(a.Quantity, b.Quantity) AS Quantity,
    COALESCE(a.InvoiceDate, b.InvoiceDate) AS InvoiceDate,
    COALESCE(a.Price, b.Price) AS Price,
    COALESCE(a.Customer_ID, b.Customer_ID) AS Customer_ID,
    COALESCE(a.Country, b.Country) AS Country
INTO [SalesDataAnalysis].[dbo].[sales_combined_2009_2011]
FROM [SalesDataAnalysis].[dbo].[sales_2009_2010_filtered] a
FULL OUTER JOIN [SalesDataAnalysis].[dbo].[sales_2010_2011_filtered] b
ON a.Invoice = b.Invoice AND a.StockCode = b.StockCode AND a.InvoiceDate = b.InvoiceDate
```

I'm also keeping an unfiltered combined table ‘sales_combined_2009_2011_unfiltered’, in case we want to work with all of the data including negative quantities. 
```sql
SELECT
    COALESCE(a.Invoice, b.Invoice) AS Invoice,
    COALESCE(a.StockCode, b.StockCode) AS StockCode,
    COALESCE(a.Description, b.Description) AS Description,
    COALESCE(a.Quantity, b.Quantity) AS Quantity,
    COALESCE(a.InvoiceDate, b.InvoiceDate) AS InvoiceDate,
    COALESCE(a.Price, b.Price) AS Price,
    COALESCE(a.Customer_ID, b.Customer_ID) AS Customer_ID,
    COALESCE(a.Country, b.Country) AS Country
INTO [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
FROM [SalesDataAnalysis].[dbo].[sales_2009_2010] a
FULL OUTER JOIN [SalesDataAnalysis].[dbo].[sales_2010_2011] b
ON a.Invoice = b.Invoice AND a.StockCode = b.StockCode AND a.InvoiceDate = b.InvoiceDate
```
The reason for joining the tables on `a.Invoice = b.Invoice AND a.StockCode = b.StockCode AND a.InvoiceDate = b.InvoiceDate` is to make sure that the join statement correctly joins elements that are from the exact same item in the same order.


Now, add a primary key to the new combined table:
```sql
ALTER TABLE [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
ADD rowID INT IDENTITY(1,1);

ALTER TABLE [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
ADD PRIMARY KEY (rowID);
```



## Data analysis

First we can investigate monthly sales trends. We can look at total revenue, total number of orders/invoices, total quantity of items sold and number of unique customers each month. The following query was used:
```sql
-- Total revenue for each month
SELECT 
    YEAR(InvoiceDate) AS Year,
    MONTH(InvoiceDate) AS Month,
    SUM(Quantity * Price) AS TotalRevenue
FROM 
    [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
GROUP BY 
    YEAR(InvoiceDate), MONTH(InvoiceDate)
ORDER BY 
    Year, Month;

-- Total number of orders/invoices for each month
SELECT 
    YEAR(InvoiceDate) AS Year,
    MONTH(InvoiceDate) AS Month,
    COUNT(DISTINCT Invoice) AS TotalInvoices
FROM 
    [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
GROUP BY 
    YEAR(InvoiceDate), MONTH(InvoiceDate)
ORDER BY 
    Year, Month;

-- Total quantity of items sold for each month
SELECT 
    YEAR(InvoiceDate) AS Year,
    MONTH(InvoiceDate) AS Month,
    SUM(Quantity) AS TotalSoldQuantity
FROM 
    [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
GROUP BY 
    YEAR(InvoiceDate), MONTH(InvoiceDate)
ORDER BY 
    Year, Month;

-- Number of unique customers (by Customer_ID) for each month
SELECT 
    YEAR(InvoiceDate) AS Year,
    MONTH(InvoiceDate) AS Month,
    COUNT(DISTINCT Customer_ID) AS UniqueCustomers
FROM 
    [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
GROUP BY 
    YEAR(InvoiceDate), MONTH(InvoiceDate)
ORDER BY 
    Year, Month;
```

The resulting tables from this query are saved to spreadsheet files in the `.csv` format for visualization later. The following additional information was also found:

Top selling products:
```sql
-- Get the top 100 selling products
SELECT TOP 100
    Description,
    SUM(Quantity) AS TotalQuantitySold
FROM 
    SalesDataAnalysis.dbo.sales_combined_2009_2011_unfiltered
GROUP BY 
    Description
ORDER BY 
    TotalQuantitySold DESC
```

Customer segmentation (which customers spend the most): <!-- Analyze customer purchasing behavior by identifying the top spending customers. -->
```sql
-- Order by total money spent (by each of the customers)
SELECT 
    Customer_ID,
    SUM(Quantity * Price) AS TotalMoneySpent,
	COUNT(DISTINCT Invoice) AS NumberOfOrders
FROM 
    [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
GROUP BY 
    Customer_ID
ORDER BY 
    TotalMoneySpent DESC;

-- Order by number of orders (of each of the customers)
SELECT 
    Customer_ID,
    SUM(Quantity * Price) AS TotalMoneySpent,
	COUNT(DISTINCT Invoice) AS NumberOfOrders
FROM 
    [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
GROUP BY 
    Customer_ID
ORDER BY 
    NumberOfOrders DESC;
```

Top spending countries:
```sql
SELECT 
    Country,
    SUM(Quantity * Price) AS TotalSales,
	COUNT(DISTINCT Invoice) AS UniqueInvoices
FROM 
    [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
GROUP BY 
    Country
ORDER BY 
    TotalSales DESC;

SELECT 
    Country,
    SUM(Quantity * Price) AS TotalSales,
	COUNT(DISTINCT Invoice) AS UniqueInvoices
FROM 
    [SalesDataAnalysis].[dbo].[sales_combined_2009_2011_unfiltered]
GROUP BY 
    Country
ORDER BY 
    UniqueInvoices DESC;
```



## Data visualization and insights 
<!-- Now I will create a data visualization in Power BI in order to get more insights about the data we've worked with.  -->
Now I will create a data visualization in Power BI. This will help us make sense of what we've found so far in a more accessible way.

I import the combined, unfiltered data table, as well as all the resulting tables from the data analysis above, into Power BI. 

I create a new column in order to get a more workable time format for the months and years. Here is how: Power BI Desktop Home tab → Transform data → Transform data (opens Power Query Editor) → In Power Query Editor: Add Column → Custom Column → In the 'Custom column formula' field, enter: `=Text.From([Year]) & "-" & Text.PadStart(Text.From([Month]), 2, "0")`. 
<!-- (This is the Power Query M formula language.) -->

I added the following elements to the dashboard:

Visualization: Quantity and Revenue by Country. I also added a drill-down option for Description (item description) in order to see which items were sold the most for each country. 

Visualization: Invoices, Unique customers, Quantity (all items) and Revenue by Date. Two y-axes for the different scales (invoices and unique customers on one side, and quantity and revenue on the other side).

Visualization: Card showing average monthly revenue.
I excluded the first and last months since they were not full months in the dataset. The DAX query I used to calculate the monthly revenue is the following:
```dax
AverageMonthlyRevenue =

VAR totalRevenueExclFirstAndLastMonths = CALCULATE(
    SUM(monthlySalesTrends[TotalRevenue]),
    FILTER(monthlySalesTrends, monthlySalesTrends[Date] <> "2009-12" && monthlySalesTrends[Date] <> "2011-12")
)

VAR selectedNumberOfMonths = CALCULATE(
    COUNT(monthlySalesTrends[Month]),
    FILTER(monthlySalesTrends, monthlySalesTrends[Date] <> "2009-12" && monthlySalesTrends[Date] <> "2011-12")
)

VAR avgMonthlyRevenue = DIVIDE(totalRevenueExclFirstAndLastMonths, selectedNumberOfMonths)

-- Format avgMonthlyRevenue so that it is displayed with an appropriate number of digits
VAR avgMonthlyRevenue_formatted =
    SWITCH(
        TRUE(),
        ABS(avgMonthlyRevenue) >= 1000000, FORMAT(avgMonthlyRevenue / 1000000, "0.##") & "M",
        ABS(avgMonthlyRevenue) >= 100000, FORMAT(avgMonthlyRevenue / 1000, "0") & "K",
        ABS(avgMonthlyRevenue) >= 1000, FORMAT(avgMonthlyRevenue / 1000, "0.#") & "K",
        FORMAT(avgMonthlyRevenue, "0")
    )

RETURN avgMonthlyRevenue_formatted
```

Lastly, I added slicers for Year and Month, so that the data can be shown for specific years/months.

The image at the beginning of this post was indeed this dashboard. Showing it again here:
![Dashboard screenshot](/project_online-retail-sales/online_retail_sales_preview.jpg)

Let's get an overview of the dashboard. 
We see a plot with info about sold quantity, revenue, and counts of invoices and unique customers for each month. With the added slicer we can look at the specific months we're interested in. 
The graph on the right-hand side shows the quantity of items sold and revenue in total, added up over the entire data set, grouped by country. I added the option of drilling down on each country, revealing how much was sold of each item to customers from that country. 
There's a card displaying the average monthly revenue at the bottom left. This average is calculated for the selected months.
The other card displays the cancellation rate in total over the entire data set. <!-- , which is seen to be 18%.   -->

By looking at the graph for revenue we can see somewhat of a pattern in the sales over a year. November is seen to be the month with the highest revenue in both years registered. The average monthly revenue including all months is 776K. The average November revenue is £1.44M. If we exclude the final quarter of the year (months 9-12), the average monthly revenue drops to £636K. A natural explanation of this could be that many people are doing gift shopping for Christmas in the months leading up to Christmas. 
When we look at the Countries visualization, we see that by far the largest amount of customers come from the UK. The UK is very much a Christmas-celebrating country (or countries, depending on how you look at it), so this is consistent with the idea that sales spike in November because of Christmas shopping.

<!-- Exploring the dashboard to see some more concrete sales info, we can look at the sales for a couple of countries:  -->
Let's get completely specific and look closer at the sales info for a couple of countries.
For example, drilling down on the UK, we see that the two highest revenue items there are (excluding postage/shipping) a cakestand and a tea light holder:
![Drill down UK](/project_online-retail-sales/Country-drill-down-UK.PNG)

And when drilling down on Norway, we see that the two highest revenue items are a plant growing kit and a child's breakfast set:
![Drill down Norway](/project_online-retail-sales/Country-drill-down-Norway.PNG)



Some possible recommendations that could be given based on the information we've found: 

- Since there is seen an increase of sales in the months leading up to Christmas, the business can consider running special promotions, have extra staff capacity in areas like customer service, and make sure that the stock of the popular items are sufficient in the final quarter of the year.

- Since different products are popular in different countries: If inventories are kept in different warehouses in different locations in the world, stock in the different warehouses can be adjusted based on what items are more popular in which countries. 

- Based on the information on the spending behavior of different customers, the business can implement targeted marketing campaigns for high-value customers. Though, I am not sure whether or not this is actually more effective for increasing sales compared to doing marketing campaigns for all of the customers in the data set. People specializing in marketing or business economics might be better equipped to know what actions are best to take based on this info.

- The overall cancellation rate was found to be 18%, which seems pretty high. The business could investigate reasons for cancellations. If that is difficult with the current data they have, they could implement systematic ways to gather information about cancellations. For example, upon cancelling an order, customers could be given the option to provide the reason for the cancellation. This info could indicate what to do to reduce the cancellation rate, like improving product descriptions.


Gathering data about customer satisfaction for each order, such as a satisfaction score, could be beneficial for e.g. improving marketing strategies and for understanding cancellations trends. 

Continuing to collect sales data would also naturally be recommended. Having sales data for more years would be beneficial for getting a better understanding of what are real trends, what are random fluctuations, and perhaps also other relationships between sales and various events in the market or in the world that only become apparrent when having more years of data to compare with.

