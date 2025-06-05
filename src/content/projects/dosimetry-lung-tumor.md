---
title: Radiation therapy: Dosimetry for a lung tumor
description: A simplified dosimetry calculation for a lung tumor
publishDate: 'Jun 05 2025'
isFeatured: true
seo:
  image:
    src: 'placeholder.png'
---
<!-- Tags: medical physics, radiation therapy -->
<!-- First published: Jun 05 2025 -->
<!-- Last updated: Jun 05 2025 -->


**Project overview**: 

In this project I implement a basic dosimetry calculation in the context of radiation therapy treatment of lung cancer.

[_View code on GitHub_](https://github.com/amundwf/dosimetry-lung-tumor)

Note: This post is a work in progress.
So far, it's mostly just me getting familiar with terms and concepts used in medical physics and radiation therapy and doing an exploratory practice dosimetry calculation. 
Significant simplifications and assumptions have been made. It's not intended to be a realistic radiation treatment plan recommendation. I expect the results of the calculations to be off by a significant amount compared to what more sophisticated calculations would yield (using e.g. a treatment planning system). The results I got here are likely to be either too low radiation dose to be effective in killing the tumor cells, or too high dose, causing an unnecessarily large amount of damage to healthy tissue. 


## Data
I found the dataset LIDC for annotated lung CT scans through the [Cancer Imaging Archive](https://www.cancerimagingarchive.net/) [1]. I downloaded a subset of the subjects in the dataset, as the full dataset was quite large. There is actually a Python library that has been written to be able to query this dataset more easily. I used this library to filter for the `malignancy` parameter, to find a nodule annotated with the highest malignancy score, which was 5 (a 'highly suspicious' nodule). 

> **Note for reproducibility:**
> This specific nodule was found in subject 0078 in the dataset.

Among the annotated information was information about the tumor size. It provided a nodule diameter of 32.81 mm and a nodule volume of 5230.34 mm^3. 


## Assumptions
I'm making the following assumptions and simplifications here:
- The tumor in question is confirmed to be malignant, and that radiation therapy is the decided course of action (by a panel of medical experts)
- Radiation therapy type: Stereotactic body radiation therapy (SBRT)
- The treatment is fractionated (total treatment radiation dose is delivered in multiple smaller doses over time). Assume 4 fractions.
- Total treatment dose: 48 Gy (12 Gy per fraction)
- Photon energy: 6 MV
- Source-to-Axis distance (SAD): 100 cm
- A homogenous water-equivalent medium is used for the dose calculations
- Organs at risk (OARs) not taken into account
- Approximately spherical tumor shape 
- Depth of isocenter from the skin, anterior side (anterior beam): 12.5 cm
- Depth of isocenter from the skin, posterior side (posterior beam): 12.5 cm
- Reference machine output $D_0$ for SAD setup: Assume 1 MU will deliver 1 cGy at depth $d_\text{max}$ for a 10x10 cm field at the isocenter. That is, $D_0 = 1\,\text{cGy/MU}$.

The SBRT is simplified here by only using two beams. In reality, more beams would be used in order to have only the tumor receive a high concentration of radiation where the beams intersect, while the healthy tissue would receive the lower dose concentrations of the individual beams. I will use a depth of 12.5 cm to the isocenter and tumor (assuming the patient is precisely positioned with the tumor in the isocenter) for both the anterior and posterior sides/beams. 

I'll use the tumor volume provided in the data annotations for the patient for the GTV (Gross Tumor Volume). 
For the Clinical Target Volume (CTV) I'll use an added margin of 1 mm. 
For the Planning Target Volume (PTV) I'll use an added margin of 5 mm in all directions. This is a simplification that leads to some redundant margin volume, as the breathing motion usually is mostly along a specific axis.

<!-- GTV, CTV and PTV in this case.
GTV (Gross Tumor Volume) represents the visible, palpable tumor. 
CTV (Clinical Target Volume) expands GTV, encompassing microscopic disease and possible spread. 
PTV (Planning Target Volume) further expands CTV to account for patient movement and setup errors. 
 -->

The _total output factor_ $S_{c,p}$ is a quantity that attempts to account for both collimator ($c$) scattering and scattering occurring within the patient's body (a.k.a. 'phantom ($p$) scattering'). 
I will assume a total output factor for a 4.5x4.5 cm field size, in reference to a 10x10 cm field size, of $S_{c,p} = 0.96$.

Assume the following Tissue Maximum Ratio (TMR) values table for this context:

| Depth (cm) | Field Size 4x4 cm² | Field Size 5x5 cm² |
| :--------: | :----------------: | :----------------: |
|    12.0    |       0.727        |       0.741        |
|    14.0    |       0.683        |       0.698        |

Based on these values, I did (bi)linear interpolation to find the TMR value at depth = 12.5 cm and field size = 4.5x4.5 cm. This yielded a TMR of 0.723. 


## Known quantities
- Tumor diameter: 32.8 mm
- Depth of maximum dose for 6 MV photons in water: $d_\text{max} = 1.5\,\text{cm}$.


## Calculation of MUs
Now for calculating how many Monitor Units for each beam, $\text{MU}_\text{beam}$, will yield the target dose $D_\text{beam}$ to the tumor tissue for this field size and depth.

Total prescribed dose for one treatment fraction is 12 Gy = 1200 cGy. Assuming equal contribution from both beams, the target contribution to the tumor from each of the two beams is then

$$
D_\text{beam} = (1200\,\text{cGy})/2 = 600\,\text{cGy}.
$$

The formula for MUs I used was
$$
\text{MU}_\text{beam} = \frac{D_\text{beam}}{D_0 \cdot \text{TMR} \cdot S_{c,p}},
$$

which, upon plugging in the values of the variables involved, yields these results:

Total MUs for the fraction: 1728.6 MU,

MUs for AP beam: 864.3 MU,

MUs for PA beam: 864.3 MU.


## References
1. [1] Armato III, Samuel G., et al. Data From LIDC-IDRI. 4, The Cancer Imaging Archive, 2015, doi:10.7937/K9/TCIA.2015.LO9QL9SX. **Link:** https://www.cancerimagingarchive.net/collection/lidc-idri/