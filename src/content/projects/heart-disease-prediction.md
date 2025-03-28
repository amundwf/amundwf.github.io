---
title: Heart disease prediction
description: Predicting heart disease with machine learning
publishDate: 'Mar 28 2025'
isFeatured: true
seo:
  image:
    src: 'placeholder.png'
    #src: 'project_online-retail-sales/online_retail_sales_preview.jpg'
---

<!-- ![Project preview](/project_online-retail-sales/online_retail_sales_preview.jpg) -->

**Project overview:**

In this project I implemented a machine learning classifier to predict heart disease, based on the article *Deep Ensemble Detection of Congestive Heart Failure Using Short-Term RR Intervals* by Wang et al. (2019). 
The classifier is XGBoost with a combination of expert features and deep learning (DL) features as input features. The DL features were calculated with a type of convolutional neural network (CNN).

I used Python throughout the project (Jupyter notebook). 
For speeding up the training of the CNN, I used cloud compute at Google Colab.

[_View code on GitHub_](https://github.com/amundwf/heart-disease-prediction)

## Datasets
I retrieved the datasets from PhysioNet [1]. The following datasets were used:

- BIDMC Congestive Heart Failure Database (BIDMC-CHF) [2]
- Congestive Heart Failure RR Interval Database (CHF-RR) [3]
- MIT-BIH Normal Sinus Rhythm Database (NSR) [4]
- Normal Sinus Rhythm RR Interval Database (NSR-RR) [5]
- Fantasia Database (FD)  [6]

These datasets or databases were split into two groups: Database 1 (DB1), consisting of the BIDMC-CHF, NSR, and FD (normal) datasets, and Database 2 (DB2), consisting of the CHF-RR and NSR-RR datasets. I will also be looking at all of them together, which will be referred to as 'all DBs'.

### Some info about heart data
Heart data can come in different forms. ECG, electrocardiograms, show the heart voltage with electrodes placed on certain positions on the skin around the heart area, recorded over time. Each normal heartbeat has a characteristic shape on the ECG. Some of these points in the graph, where there are shapes that consistently show up ,have been named with letters. For example, Q, R and S are three such points. The R point is the most prominent peak seen on an ECG for a normal heartbeat. The interval between two such R points defines how long a heartbeat was, or how long time there was between two heartbeats. This is called an RR-interval, or an RRI for short. The ECG file can be annotated after its recording, to label where in the time series the R waves are located. This can then be used to calculate RRIs for all heartbeats. 

In this project, I'm going to train a model to predict whether an individual has heart disease or not, using RRI data.

### Looking at the data
Some of the five datasets have fully detalied ECG voltage data, where annotations of R-peaks are located in separate files, while other datasets have annotations only.

In the case where we have both the heart voltage data and the annotations, we can see where the R peaks are located in a heartbeat. 
The following figure shows part of the beginning of the heartbeat data from one of the subjects in the BIDMC-CHF dataset. 
<!-- data_exploration.ipynb -->
![BIDMC-CHF ECG example, annotated](/project_heart-disease-prediction/BIDMC-CHF_ECG_plot_annotated.png)

The sample rate of this dataset is 250 samples per second, or 250 Hz. So, one second (and roughly one heartbeat) passes every 250 samples. 

Similarly, the next figure shows a 10 second interval of annotations for heart data of a subject in the CHF-RR database. This dataset contains only the R-wave annotations.
![CHF-RR ECG annotations example](/project_heart-disease-prediction/CHF-RR_ECG_annotations_plot.png) 


## Preprocessing
For this machine learning task, we need the RR intervals from the annotation files with the R-peak positions in time. Before that, some preprocessing is needed. 

<!-- preprocessing.ipynb -->
The pre-processing was done in a program in these steps:
The program opens each person's heartbeat data one at a time. The RR intervals are retrieved based on the R-wave annotations. They are then cleaned by removing RR intervals greater than two seconds and heartbeats labeled as abnormal. The cleaned RRI data is then put into a CSV file for later use. This is done for each subject in each of the five datasets. 

The information about the annotations symbols was found at https://archive.physionet.org/physiobank/annotations.shtml. 
As an example, in the BIDMC dataset, the following symbols occurred at least once in the annotations of a subject the dataset: {'V', 'r', 'N', '+', 'S'}. 
The meanings of these annotations are:
- N: Normal beat
- V: Premature ventricular contraction
- r: R-on-T premature ventricular contraction
- S: Supraventricular premature or ectopic beat (atrial or nodal)
- "+": Rhythm change.

That specific subject had the following amounts of the various annotations: N: 74 985, V: 240, S: 293, r: 28, +: 2. 
So, most heartbeats were normal, but there are some abnormal ones.
As Wang et al. did, I discarded the abnormal heartbeats, meaning I kept only the heartbeats labeled as normal ('N'). The cleaned RRI data was saved to CSV.
<!-- Folder: /data/cleaned_RRIs/ -->

I partitioned the RR interval data into segments of length 500. None of the subjects' RRI data were exactly divisible by 500, so the final segment of each subject would be of length less than 500. This was handled by simply discarding the final segment for each subject.

In order to keep things manageable for the computer memory, only one segment of RRIs was kept in memory at a time. The expert features are calculated for that segment, and those feature values are added to a data array (using Pandas). The program then moves on to the next segment, doing this for all segments of all subjects in all of the databases. The mean values and standard deviations of the feature values are then calculated at the end. 

#### **Data splits**
The data was split into a training set, a validation set and a test set.
For the test sets, Wang et al. used six subjects (three CHF=0 and three CHF=1) in total from the BIDMC-CHF, NSR, and FD databases, and twelve subjects (six CHF=0 and six CHF=1) in total from the NSR-RR and CHF-RR databases.
Now, six or twelve subjects is not a lot. The databases aren't very big, which is probably why such a modest amount of subjects were used for the test sets. However, one subject corresponds to several RRI segments, with segment lengths N=500 being used in this case. The subjects' heart recordings range from a bit over 5000 RRIs to a bit over 100 000 RRIs each, depending on the database. This corresponds to 10 to 200 segments of length 500 per subject.
The rest of the data was designated as the training set. 20% of the training set was set aside for validation, for doing early-stopping in order to prevent overfitting and to avoid unneccesary computation. 


## Model features
The classifier will use a combination of expert features and deep learning features calculated from the RRI data. Expert features are features that are calculated following a known 'recipe', like the the mean RRI length (time domain), total power (frequency domain) or sample entropy (nonlinear feature). Three different categories of expert features were calculated: time domain features, frequency domain features and nonlinear features. 
23 expert features were calculated.

The features are listed and explained (in varying detail) below.

### Time domain features
- mean_RR: The mean value of the RRI segment
- std_RR: The standard deviation
- min_RR: Lowest RRI value
- media_RR: The median
- CV: This abbreviation wasn't explicit mentioned in the article or in the reference they provided for this feature, but it's most likely the coefficient of variation. This is defined as the standard deviation divided by the mean value. 
- SDNN: Standard deviation of intervals between heartbeats. The N's in 'NN' stands for 'Normal', referring to normal heartbeats. From what info I could find about it, it seems to be the same as an RR interval, but only valid if the two consecutive heartbeats are normal (not abnormal/irregular). However, it's unclear in the article how this is different from the std_RR feature, given that they mention removing all abnormal heartbeats as part of the preprocessing. For this reason, I just used std_RR.
- RMSSD: Root mean square of successive differences
- NN50: Number of pairs of successive RR intervals that differ by more than 50 ms
- pNN50: Percentage of NN50 among all of the RRIs
- ΔRRImax: The difference between the longest RR interval and the shortest RR interval in the segment.

I didn't have access to the article Wang et al. referred to with definitions of the features NADev and NADiff. From what I could find of information from other articles: 
- NADev: Normalized absolute deviation (from the mean)
$$
\text{NADev} = \frac{1}{N} \sum_{i=1}^{N} \frac{|RR_i - \mu_{RR}|}{\mu_{RR}}
$$
- NADiff: Normalized absolute difference
$$
\text{NADiff} = \frac{1}{N-1} \sum_{i=1}^{N-1} \frac{|RR_{i+1} - RR_i|}{\mu_{RR}}
$$

### Frequency domain features
The RRI data is an event based type of data. This means that the data is about occurrences along the time axis, or more specifically, the intervals between the occurrences. There's no y-axis involved in this type of data. When doing analysis in the frequency domain with the normal Fourier transform (FT), it's usually equally spaced time measurements that record some variable that varies along the y-axis. The FT can only handle equally spaced time data well. The RRI data, on the other hand, is unequally spaced along the time axis. For this, the *Lomb-Scargle periodogram* method is more appropriate for doing frequency domain analysis.

The frequency spectrum was divided into very low frequencies (vLF), low frequencies (LF) and high frequencies (HF). I used the same ranges as in [7], where vLF is defined as frequencies less than 0.04 Hz, LF is frequencies between 0.04-0.15 Hz and HF is frequencies between 0.15-0.40 Hz. 

The power spectral density is a measure from signal processing that tells us how much the various frequencies contribute to the full signal. 
If an oscillation of a certain frequency is present in a signal, that frequency's contribution to the power of the signal depends on the amplitude of that oscillation. Small amplitude corresponds to small power contribution, and large amplitude corresponds to large power contribution.

Both absolute values of power (units s^2 or ms^2) and normalized units were used as features of the LF and HF frequency bands. LF power in normalized units is defined as the percentage of LF power in the sum of LF power and HF power. Similarly, HF power in normalized units is the percentage of HF power. 

In summary, the following frequency domain features were calculated:
- Total power
- VLF power
- LF power
- HF power
- LF/HF ratio
- LF power, normalized units
- HF power, normalized units

### Nonlinear features
The nonlinear features that will be used here are SD1 and SD2 features from Poincaré plots, Sample Entropy (SampEn or SE), Renyi Entropy (RE) and detrended fluctuation analysis (DFA). 

#### **SD1 and SD2 (Poincaré plot)**
A Poincaré plot plots consecutive RR intervals in a scatter plot. The first RRI is along the x axis, and the subsequent RRI is along the y axis. The 'most normal' thing to happen is that two consecutive RRIs are around the same length (if one heartbeat interval was 0.7 seconds, you'd most often expect that the next one was around 0.7 seconds as well). But the heartbeats do vary. Variation along the axis defined by the line y=x is quantified by SD2, which is the standard deviation of the data along that axis. This corresponds to longer-term variations, since the position along the y=x line tells us roughly how long the heartbeats were, which can vary over time (changing bit by bit for a number of subsequent heartbeats). Variation along the axis perpendicular to that line is quantified by SD1, which is the standard deviation along that axis. This corresponds to shorter-term variations. This is because the deviations from the 'center line' y=x tells us something about how far away from the expected value the second RR interval was, providing information about the variations on the heartbeat-to-heartbeat scale. 

The formula for SD1 is:
$$
SD1 = \sqrt{\frac{1}{2}} \times SDSD,
$$

where SDSD is the standard deviation of successive differences.

The formula for SD2 is:
$$
SD2 = \sqrt{2 \times SDRR^2 - \frac{1}{2} \times SDSD^2} = \sqrt{2 \times SDRR^2 - SD1^2},
$$

where SDRR is the standard deviation of the RRI segment (same as std_RR mentioned earlier).

#### **Sample entropy (SampEn)**
SampEn is a measure of the complexity of a time series. It's calculated by estimating the probability of segments (of length $m$), that are similar within a tolerance $r$, remaining similar when their lengths are increased by one (length $m+1$). 
A low SampEn indicates a more regular (less complex) signal, while a high SampEn indicates a less regular signal and/or noise.

I used the `nolds` Python library for the SampEn calculation.

#### **Renyi Entropy (RyEn)**
Renyi entropy is another measure of complexity. It can be described as a generalization of Shannon entropy. It's defined as:

$$
H_{\alpha} = \frac{1}{1 - \alpha} \log_2 \left( \sum_{i=1}^{n} p_i^{\alpha} \right)
$$

where $p_i$ is the (empirical) probability of observing a segment of length $m$ (within value bins that the segment's elements were in, or estimated with kernel density estimation), and $\alpha$ is the Renyi entropy order. 
For values of $\alpha$ greater than 1, frequently occurring patterns (higher $p_i$) are emphasized more due to the $p_i^\alpha$ terms. I used values $\alpha=3$ and $m=8$, based on values used for CHF detection in a research paper [8].
A low Renyi entropy then indicates low complexity in the RRI segments, meaning the segments are relatively similar overall. Vice versa for high Renyi entropy.

#### **Detrended fluctuation analysis (DFA)**
Detrended fluctuation analysis involves calculating a function $F(n)$ that describes the fluctuation of the input data as a function of segment length $n$, and then, assuming a power law  $F(n) \propto n^\alpha$, finding the exponent $\alpha$. The number $\alpha$ is the output of DFA. The details of the algorithm, as well as how the output value can be interpreted, is well-described in online sources, for example on Wikipedia [9].

I used the `fathon` Python library for the DFA calculation. 
DFA requires that we set the range of segment ('window') sizes, defined by the parameters `min_window` and `max_window` for the boundaries and `step` for the increment size. I ended up using parameters `min_window=5`, `max_window=50` and `step=5`. These values were found by trial and error, and by comparing with the DFA function in the `nolds` library (which was computationally slower but the documentation was solid). `fathon`'s DFA implementation with these parameter values gave output values that were relatively close matches with the `nolds` DFA output.

### Expert features: Putting it together
The expert features were calculated for all segments in the dataset, resulting in the following mean values and standard deviations (means ± SDs) for subjects with normal sinus rythm (CHF=0) and subjects with congestive heart failure (CHF=1).

| HRV indices     | NSR (CHF=0) | CHF (CHF=1) |
|-----------------|-------------|-------------|
| mean_RR         | 0.79±0.15   | 0.69±0.12   |
| std_RR          | 0.06±0.04   | 0.09±0.07   |
| min_RR          | 0.65±0.12   | 0.60±0.10   |
| media_RR        | 0.79±0.16   | 0.68±0.12   |
| CV              | 0.08±0.04   | 0.12±0.09   |
| ΔRRImax         | 0.46±0.32   | 0.73±0.39   |
| RMSSD           | 0.04±0.04   | 0.11±0.10   |
| NN50            | 42.96±63.47 | 38.99±64.77 |
| pNN50           | 8.59±12.69  | 7.80±12.95  |
| NADev           | 0.06±0.03   | 0.06±0.07   |
| NADiff          | 0.03±0.02   | 0.06±0.08   |
| Total power     | 0.04±0.02   | 0.04±0.01   |
| VLF power       | 0.03±0.01   | 0.03±0.01   |
| LF power        | 0.00±0.01   | 0.00±0.00   |
| HF power        | 0.00±0.01   | 0.00±0.01   |
| LF/HF ratio     | 3.19±1.34   | 1.96±1.45   |
| LF power n.u.   | 72.62±12.49 | 56.81±20.95 |
| HF power n.u.   | 27.38±12.49 | 43.19±20.95 |
| SE              | 1.21±0.48   | 0.70±0.55   |
| SD1             | 0.03±0.03   | 0.08±0.07   |
| SD2             | 0.08±0.04   | 0.09±0.07   |
| RE              | 8.95±0.01   | 8.93±0.04   |
| DFA             | 1.04±0.22   | 0.75±0.28   |

### Deep learning features
Wang et al. describe a convolutional neural network architecture they call ConvPool-CNN-C. It's a type of convolutional neural network that includes a global average pooling layer. 
The neural network is used to extract deep learning features from the dataset, which will in turn be used in the XGBoost classifier later. 
I implemented this in PyTorch based on the description they provided in their article.

The neural network is made up of the following layers: The RRI segment as the input layer, two convolutional layers, a pooling layer `MaxPooling1D` with kernel size = 2, two more convolutional layers, a global average pooling layer which gives 32 deep learning features, and finally a fully connected linear layer as the output that outputs logits that can be used for classification. 
To see the architecture visualized, see [10].

I experimented a bit with test running the CNN on my laptop on small subsets of the training set of the data before training the model 'for real' on the full training set. 
With `batch_size=4` and around 100 segments (segment length = 500 RRIs), each epoch of training took just under 5 seconds on average. 
For comparison, the full training set contained 5000 segments. That would take like 7 hours on my laptop, so yeah, cloud compute was the way to go. But that comes a bit later - first, some more testing on the smaller training set.

The accuracy of the CNN on the training set and validation set was tested while doing the test run training. The training accuracy only reached around 80-85% accuracy at best, even for very small datasets with only 10-20 RRI segments as the training set. The validation accuracy reached a bit over 70% accuracy at best. I would have expected that the algorithm would overfit the data and reach 100% accuracy.
Maybe some layer(s) in the CNN provide an (implicit) regularization effect, meaning that there is 'too much' prevention of overfitting for reaching 100% accuracy even on the training set. 

The results did seem to vary a bit from run to run. Sometimes not getting out of 50% training accuracy, other times quickly improving but maybe stopping at around 80%, and sometimes finding a good minimum with convergence to 100% training accuracy. 
This variation could come from randomly initialized parameter values sometimes being closer to a good local minimum.

Testing with a simpler neural network: I defined a simple neural network that I named SimpleFFN (Simple feedforward neural network), consisting of a flattening layer, a fully connected layer with 32 neurons, followed by another fully connected layer that outputs raw logits. 
The results when training the SimpleFFN model:
![alt text](/project_heart-disease-prediction/train_val_performance_SimpleFFN_n_subjects10_n_segments1.png)
The training accuracy did reach 100%, showing that a simple network can at least fit the training data well.

Next, I did two tests with simplified versions of the ConvPool-CNN-C network. The design of the first simplified CNN was a similar layer structure as the full ConvPool-CNN-C network, but with a single convolutional layer before and after the first pooling layer rather than two consecutive convolutional layers before and after the pooling layer. The training results of that model:

<!-- CNN_more_simple(), with n_subjects=10 and n_segments=1:
Final training accuracy: 100.00%
Final validation accuracy: 75.96% 
-->
![alt text](/project_heart-disease-prediction/train_val_performance_CNN_more_simple_n_subjects10_n_segments1.png)

Better validation performance than the SimpleFFN model, but not reaching a good validation loss minimum. 

Next, I simplified it further, to see what would happen if the CNN had only 'round' of convolutional + pooling layers (rather than two). So that the model consisted of a convolutional layer, a max pooling layer, and then immediately into the global average pooling layer, and finally the fully connected linear layer. The results: This simplified CNN was not able to fit to the training data, even with 300 epochs of training. 

<!-- CNN_even_more_simple(), with n_subjects=10 and n_segments=1:
Final training accuracy: 70.00%
Final validation accuracy: 73.67% -->
![alt text](/project_heart-disease-prediction/train_val_performance_CNN_even_more_simple_n_subjects10_n_segments1.png)

Maybe that's something I could have guessed - it is a bit strange network structure to have two pooling layers immediately after each other. But I did want to see what would actually happen, so there we have it. 
It also might be that a single convolutional layer *does* pick up on some features in the data, but that they're too 'low level' features to be useful for classification at that point. A second layer could perhaps detect some higher level patterns based on the features from the first convolutional layer; features that *are* useful for classification. 

With these test runs done it seemed at least that the setup worked, and it was time to train the ConvPoolCNN model for real on the entire training set (and hopefully get some better performance with the larger amount of data).

#### **Training the CNN**
As previously mentioned, I used cloud compute for training the full model, and decided to go with Google Colab.

I did 100 epochs of training. Each epoch took around one minute to run (on Colab CPU; GPU wasn't available at the time).
Accuracy and loss were calculated for the training set and the validation set after each epoch.
The performance results during training were as follows:
![alt text](/project_heart-disease-prediction/tranining_and_validation_performance_N500_CNN_whole_training_set.png)

That did converge more nicely on the validation set than the previous test run on the smaller dataset. The model (weights) were saved at each 5th epoch. The model had the highest accuracy at 95 epochs, so I used that one for calculating the DL features. 

And that was it for the CNN training. With the trained model, I could now calculate the deep learning features. This was done by doing a forward pass with an RRI segment (i.e. a data segment of 500 RRIs), but stopping one layer short of the output layer which returns a logit value. In other words, the output from passing an RRI segment through all the layers except the last one gives the DL features. More specifically, that output is a vector of length 32, and each of those 32 elements is a DL feature.

The 32 DL features were calculated for all segments of all subjects in the dataset, and then saved to CSV along with the expert features calculated before. Now all RRI segments in the dataset had both the various expert features and the DL features associated with them. 

## Classifier: XGBoost
Now for putting together the classifier.
XGBoost is a type of ensemble classifier. An ensemble classifier is a classifier based on multiple classifiers used in combination in order to make better predictions than any single one of them would have been able to on their own. Each of the smaller classifiers that make up the ensemble are often referred to as base classifiers or weak classifiers.
Ensemble classifiers usually refers to methods called bagging, boosting or stacking. 

XGBoost is based on boosting, which involves creating many base classifiers and train them in sequence. Each individual base classifier doesn't need too much computation to train. After each base classifier is trained, it's added to the model. The residual (error) is then evaluated, and XGBoost focuses the next base classifier on predicting those residuals, iteratively reducing the overall error for each new base classifier added.

#### **Performance metrics**
To measure the performance of the XGBoost classifier, the following three metrics were used: Accuracy (Acc), sensitivity (Se) and specificity (Sp). They are defined as follows:

$$
\begin{align*}
\text{Acc} &= \frac{\text{TP} + \text{TN}}{\text{TP} + \text{TN} + \text{FP} + \text{FN}} \\
&\\
\text{Se}  &= \frac{\text{TP}}{\text{TP} + \text{FN}} \\
&\\
\text{Sp}  &= \frac{\text{TN}}{\text{TN} + \text{FP}}
\end{align*}
$$

where TP, TN, FP and FN refer to the number of True Positive, True Negative, False Positive and False Negative predictions, respectively.

### XGBoost performance

To run XGBoost, I used the XGBoost Scikit-learn API. 

Training XGBoost on the full training set with default hyperparameters, the following performance was achieved.

All DBs, Generated splits 1, default hyperparameters:
| Dataset    | Accuracy   | Sensitivity | Specificity |
|------------|------------|-------------|-------------|
| Training   | 99.58%    | 99.37%    | 99.73%    |
| Validation | 96.34%    | 95.19%    | 97.05%    |
| Test       | 72.44%    | 59.67%    | 94.37%    |

Here, 'Generated splits 1' refers to the first data split I used that was generated by the script I wrote for randomly sorting the data into training, validation and test set. Later, another set of splits were generated, named 'Generated splits 2', to check if that would result in a notably different performance results (in case of a somehow imbalanced roll). 

The training and validation performance here isn't bad. But we see that it doesn't transfer very well to the test set. There is some overfitting happening. 

Wang et al. did not specify the hyperparameter values they used for XGBoost, so I used the Optuna package for hyperparameter tuning to see if it can find better hyperparameter values for performance. 
> **Note for reproducibility:**
> I used XGBoost version 2.1.3 and scikit-learn version 1.3.1. I had to downgrade scikit-learn from version 1.6.1 (the latest version at the time), to 1.3.1 in order for the two to be compatible. This will supposedly be fixed in a future version of scikit-learn.

<!-- Results from running Optuna (DB1 dataset): 
Best hyperparameters: {
  'max_depth': 9, 
  'learning_rate': 0.026597100335812092, 
  'n_estimators': 290, 
  'subsample': 0.5545088229979276, 
  'colsample_bytree': 0.66451032725084, 
  'gamma': 4.749860046120411, 
  'reg_alpha': 0.8515819929862577, 
  'reg_lambda': 0.6503126183889657
}
Best cross-validated score (negative accuracy): -0.9712907016385831
-->
<!-- **Best hyperparameters (Optuna):**
- max_depth: 4
- learning_rate: 0.13676
- n_estimators: 97
- subsample: 0.59038
- colsample_bytree: 0.76797
- gamma: 0.90575
- reg_alpha: 0.56413
- reg_lambda: 0.51727

**Best cross-validated score (negative accuracy):** -0.93393 -->

Still, even after hyperparameter tuning, there was a large discrepancy between the validation and test sets.

I generated the next set of splits, Generated splits 2, and trained XGBoost again, for all DBs, DB1, and DB2, with default and tuned hyperparameters. 
The performance results of these models were as follows.

**Performance, all DBs:**

All DBs, Generated splits 2, default hyperparameters:
| Dataset    | Accuracy   | Sensitivity | Specificity |
|------------|------------|-------------|-------------|
| Training   | 92.71%    | 84.16%    | 97.32%    |
| Validation | 81.94%    | 58.87%    | 93.96%    |
| Test       | 73.99%    | 57.89%    | 99.41%    |

All DBs, Generated splits 2, tuned hyperparameters:
<!-- **Best Hyperparameters:**
- max_depth: 3
- learning_rate: 0.02950
- n_estimators: 169
- subsample: 0.59386
- colsample_bytree: 0.82796
- gamma: 4.97619
- reg_alpha: 0.69393
- reg_lambda: 0.77669
**CV Score:** -0.87574 -->
| Dataset    | Accuracy   | Sensitivity | Specificity |
|------------|------------|-------------|-------------|
| Training   | 91.40%    | 82.63%    | 96.11%    |
| Validation | 83.23%    | 63.25%    | 93.64%    |
| Test       | 79.95%    | 67.63%    | 99.41%    |


**Performance, DB1:**
DB1, Generated splits 2, default hyperparameters:
| Dataset    | Accuracy   | Sensitivity | Specificity |
|------------|------------|-------------|-------------|
| Training   | 99.06%    | 97.97%     | 99.83%     |
| Validation | 95.42%    | 95.15%     | 95.60%     |
| Test       | 89.14%    | 82.79%     | 100.00%     |

DB1, Generated splits 2, tuned hyperparameters:
<!-- **Best Hyperparameters:**
- max_depth: 4
- learning_rate: 0.13676
- n_estimators: 97
- subsample: 0.59038
- colsample_bytree: 0.76797
- gamma: 0.90575
- reg_alpha: 0.56413
- reg_lambda: 0.51727
**CV Score:** -0.93393 -->
| Dataset    | Accuracy   | Sensitivity | Specificity |
|------------|------------|-------------|-------------|
| Training   | 99.78%    | 99.58%     | 99.93%     |
| Validation | 94.91%    | 95.78%     | 94.32%     |
| Test       | 89.14%    | 82.79%     | 100.00%     |

**Performance, DB2:**

DB2, Generated splits 2, default hyperparameters:
| Dataset    | Accuracy   | Sensitivity | Specificity |
|------------|------------|-------------|-------------|
| Training   | 89.94%    | 76.50%    | 96.86%    |
| Validation | 91.74%    | 80.80%    | 96.65%    |
| Test       | 70.00%    | 41.14%    | 98.04%    |


DB2, Generated splits 2, tuned hyperparameters:
<!-- **Best Hyperparameters:**
- max_depth: 4
- learning_rate: 0.01444
- n_estimators: 330
- subsample: 0.56856
- colsample_bytree: 0.55233
- gamma: 2.97858
- reg_alpha: 0.33961
- reg_lambda: 0.86582
**CV Score:** -0.84692 -->
| Dataset    | Accuracy   | Sensitivity | Specificity |
|------------|------------|-------------|-------------|
| Training   | 88.72%    | 74.95%    | 95.80%    |
| Validation | 93.45%    | 86.21%    | 96.70%    |
| Test       | 72.14%    | 45.57%    | 97.97%    |

The model trained on Generated splits 1, on all DBs, had better validation performance, but the test performance was significantly worse than the validation performance.
For the model trained on Generated splits 2, the training performance was slightly lower and validation performance was significantly lower than for Generated splits 1. However, the test and validation performances were much closer (-8.0% vs. -23.9%). And the test performance was comparable to the one observed in Generated splits 1. I concluded that Generated splits 2 was a somewhat more balanced split (maybe), so I proceeded with that.

The hyperparameter tuning wasn't a complete gamechanger in terms of performance improvement. It was around the same level of performance, or a little bit better in some cases. I'd say it's probably worth doing. However, it wasn't a complete solution to closing the large gap between the validation and test performance, especially for DB2. 

In any case, the performance Wang et al. reported was quite a bit better. Their results were the following:
| Dataset    | Accuracy   | Sensitivity | Specificity |
|------------|------------|-------------|-------------|
| DB1 (test set)   | 99.85%    | 100%    | 99.84%    |
| DB2 (test set) | 83.84%    | 70.26%    | 98.44%    |

Their model's performance was significantly better in terms of sensitivity, and especially for DB2, where they achieved a sensitivity of 70.3%, and the model I trained achieved a sensitivity of 45.6%. 

One observation we can make of the results so far is that the sensitivity was significantly lower than the specificity. In other words, the model is good at classifying healthy people as healthy, but not very good at classifying sick people as sick. 
This is problematic for a tool used for medical diagnosis. If a person has heart disease, it's important to discover it as early as possible so they can start any appropriate treatment as early as possible.
In the following I describe the approaches I tested for fixing the low sensitivity, and their results.

### Fixing low sensitivity

#### **Approach 1: Adjusting the decision threshold**

The XGBoost model outputs the estimated log-odds (logit) of the patient having CHF=1. A logit can be passed through the sigmoid function to get the corresponding probability.
This is then used for classification by predicting CHF=1 if the estimated probability is over 0.5, and predicting CHF=0 if the estimated probability is below 0.5. This 0.5 classification threshold can be referred to as the *decision threshold* of the classifier. 0.5 (50%) is the default value, but it can be changed if we want to adjust the trade-off between sensitivity and specificity. A higher decision threshold is a more strict filter that requires a higher estimated probability for the model to predict CHF=1. A lower decision threshold is a less strict filter, classifying more people as CHF=1. In general, a lower decision threshold leads to more people being classified as CHF=1, which leads to higher sensitivity at the cost of reduced specificity. 

In order to get a better overview of the performance at different values of the decision threshold, we can plot the distribution of estimated probabilities for the healthy individuals (CHF=0) and the sick individuals (CHF=1). Ideally, for the healthy individuals the estimated probabilities of them having CHF=1 should generally be low ('this is most likely not CHF=1'), and for the sick individuals the estimated probabilities should be high ('this is most likely CHF=1'). 

The probability estimate distributions of the trained XGBoost model:
![Probability estimates, test set, all DBs](/project_heart-disease-prediction/probability_estimates_test_set_all_DBs.png)

We see in the figure that most CHF=0 subjects (or RRI segments), seen on the left hand side of the figure, have a low probability estimate of it being CHF=1. This means that the model is confident, and generally correct, when classifying healthy subjects. 

When classifying sick subjects, seen on the right hand side, the probability distribution is more spread out. This indicates that the model is not particularily confident in its predictions in many of these cases, and it often assigns probabilities of less than 0.5 of the subject being CHF=1, which would then lead to the wrong classification if the decision threshold is 0.5. 
A significant chunk of the estimated probability distribution in the CHF=1 case is at quite low estimated probabilities.
In other words, the model is confidently wrong (at decision threshold 0.5) for quite a few of the subjects that were actually sick. So we can expect that even if we somewhat reduce the decision threshold, there will still be quite a few false negatives.
On the other hand, reducing the decision threshold somewhat doesn't seem to cause that much harm to the correct classification of most CHF=0 subjects, as the figure shows that most CHF=0 cases had estimated probabilities of less than 0.2. 

We can also plot an ROC curve to get an overview of the trade-offs involved. 

![ROC curve, all DBs](/project_heart-disease-prediction/ROC_curve_all_DBs.png)
The area under the curve (AUC) for all DBs: 0.94.

![ROC curve, DB1](/project_heart-disease-prediction/ROC_curve_DB1.png)
AUC for DB1: 0.98.

![ROC curve, DB2](/project_heart-disease-prediction/ROC_curve_DB2.png)
AUC for DB2: 0.80.

The AUC value for the 'all DBs' ROC curve was calculated to be 0.94. This is usually considered a pretty good AUC value for a binary classifier. AUC values of above 0.8 is usually considered clinically useful (REF NIH, 2023). The DB1 AUC was 0.98, which would be a good classifier. The DB2 AUC was 0.80, significantly lower, and barely within what would be considered clinically useful.

Another thing we can do is to plot the accuracy, sensitivity and specificity against different values of the decision threshold. 

Performance plot, all DBs:
![Performance vs. decision threshold, all DBs](/project_heart-disease-prediction/performance_vs_decision_threshold_all_DBs.png)

Performance plot, DB1:
![Performance vs. decision threshold, DB1](/project_heart-disease-prediction/performance_vs_decision_threshold_DB1.png)

Performance plot, DB2:
![Performance vs. decision threshold, DB2](/project_heart-disease-prediction/performance_vs_decision_threshold_DB2.png)

In the case of the DB1 data, there's quite a bit of sensitivity to gain from lowering the decision threshold. In the DB2 data there is more loss of specificity when the threshold is lowered, but still there's a greater gain in sensitivity than loss of specificity in the first couple of decimal points below the default threshold of 0.5. 

#### *Choosing a threshold: Acceptable ranges of sensitivity and specificity*
Based on what I've read, there doesn't seem to be a universally accepted rule for what decision threshold to pick. That is, how high sensitivity to aim for and how low specificity is deemed acceptable. It seems that it depends on the medical condition. A risk analysis would be necessary for the specific medical condition in order to determine what are acceptable ranges of sensitivity and specificity for that condition. How dangerous the condition is, how effective available treatments are, and the monetary cost of the various treatments come into consideration. Data about physicians' actual decisions can also be useful to determine a good decision threshold [11]. 
But, doing a risk analysis or trying to get a hold of such physician data is beyond what I'm doing here. Instead, I asked various LLMs (Perplexity, ChatGPT Search, Gemini) to search their knowledge and the internet to get some recommendations. The recommendations were roughly to aim for around 90% or higher sensitivity and accepting a specificity as low as around 70-80%. 

Based on these constraints, a performance threshold of 0.09 or 0.08 would be good choices for this model, with the following XGBoost performance results (all DBs, test set):
| Threshold | Accuracy | Sensitivity | Specificity |
|-----------|----------|-------------|-------------|
| 0.09      | 85.85%   | 89.83%      | 79.56%      |
| 0.08      | 84.54%   | 91.55%      | 73.48%      |

These results aren't too bad in terms of being able to identify heart disease. It still doesn't reach the level of accuracy of Wang et al., however. The number of false negatives in particular (at the default decision threshold) is dragging down the overall results of the model. 

#### *Comparison with CNN-only performance*
It would be useful to evaluate how well the CNN model alone performs, for comparison. That's just doing a full forward pass through the CNN model that was used to retrieve the deep learning features. 
A classifier without the expert features or XGBoost. I ran such a performance test of the CNN-only model. The results for all DBs, DB1 and DB2 can be seen in the following figures.

![CNN-only model performance on test set, all DBs](/project_heart-disease-prediction/CNN-only_model_performance_on_test_set_all_DBs.png)

![CNN-only model performance on test set, DB1](/project_heart-disease-prediction/CNN-only_model_performance_on_test_set_DB1.png)

![CNN-only model performance on test set, DB2](/project_heart-disease-prediction/CNN-only_model_performance_on_test_set_DB2.png)

Surprisingly, the performance of the CNN-only classifier is comparable to the performance of the XGBoost classifier. This is despite the fact that XGBoost has access to both the DL features and also the various expert features. 
If we look at the points where the specificity reaches 0.7 (as a lower acceptable boundary) for the all DBs case, XGBoost has a sensitivity of just over 90%, and the CNN-only has a sensitivity of around 90%. The XGBoost model might have a slight edge, but not by much.

#### **Approach 2: Change the metric to optimize for**
The 'F-beta'-measure is a scoring metric that can be used to put higher priority on either recall (sensitivity) or precision, depending on the value of the parameter `beta` ($\beta$). If $\beta$ is greater than 1, it puts higher emphasis on sensitivity. For example, if $\beta=2$, we have the F2-measure. An algorithm optimizes for a higher F2 score will then get a higher reward for increasing sensitivity (fewer false negatives) compared to the reward it gets from increasing precision (fewer false positives).  

I ran tests back-to-back with the default scoring metric and F-beta as the scoring metric.

Performance: DB2, tuned hyperparameters, default scoring metric (`'accuracy'`):
| Dataset    | Accuracy   | Sensitivity | Specificity |
|------------|------------|-------------|-------------|
| Training   | 90.87%    | 81.35%     | 96.00%     |
| Validation | 83.16%    | 62.51%     | 93.92%     |
| Test       | 75.43%    | 60.09%     | 99.66%     |

Performance: DB2, tuned hyperparameters, F-beta as scoring metric with $\beta=3$:
| Dataset    | Accuracy   | Sensitivity | Specificity |
|------------|------------|-------------|-------------|
| Training   | 93.32%    | 85.57%     | 97.48%     |
| Validation | 82.51%    | 59.88%     | 94.31%     |
| Test       | 73.83%    | 57.52%     | 99.58%     |

For this run, XGboost performed better even with the same scoring metric that was used in the previous performance on DB2 we saw earlier. The test sensitivity jumped from 46% to 60%, without changing anything in the program. I don't know exactly why. It might be that the returned Optuna hyperparameter values can make a big difference, and that the Optuna program doesn't always find as optimal values from run to run. In any case, when comparing the two runs, using F-beta ($\beta=3$) as scoring metric didn't make a notable difference on performance.

#### **Approach 3: Put higher priority on sick individuals during training**
Various methods can be used for putting a higher priority on the positive class (sick individuals) during training in XGBoost. I tried a few different ones.

#### *XGBoost parameter: `scale_pos_weight`*
The XGBoost parameter `scale_pos_weight`, if set to values greater than 1, encourages the model to over-correct errors on the positive class.

**Result**: Increasing the scale_pos_weight XGBoost parameter didn't really improve the overall performance. It did shift the score along the x-axis (decision threshold values), but didn't improve the performance metrics.

#### *Adjusting sample weights*
Adjusting sample weights means adjusting the weight of each individual data sample. For comparison, `scale_pos_weight` does it all in one sweep with the same weight for all of the data samples.
I only used it to apply the same weight to all CHF=1 examples, while leaving the weights of the CHF=0 examples unchanged. 
Now, this should really in principle do the same thing as adjusting `scale_pos_weight`. But I decided to try it anyway, just in case there was some difference in the implementation that would lead to a different result.

**Result**: Adjusting the sample weights had the same effect as adjusting `scale_pos_weight`. It shifted the accuracy along the x-axis, but didn't improve overall accuracy. 

#### *Using a custom loss/objective function*
The XGBoost Python package supports using a custom loss function (called *objective function* in XGBoost).
We can make a custom loss function that punishes false negatives more harshly than false positives. 
The idea is, perhaps if this is built into the loss function of XGBoost, it will be able to classify more actual positives (CHF=1) correctly, without having to adjust the default decision threshold of 0.5. 
Again, I wasn't sure if that would result in better overall accuracy, or if it would simply shift the performance along the axis of decision threshold values.

Implementing a custom loss function involves calculating the gradient and hessian of that loss function. This is described in the following in the case of a logistic loss function.

If we have a raw logit value $z$, the estimated probability $p$ that CHF=1 for a subject is retrieved from the sigmoid function $\sigma (z)$:
$$
p = \text P(y=1) = \sigma(z) = \frac{1}{1 + e^{-z}}
$$

The logistic loss function in binary classification is the following:

$$
L(y, p) = - \left[ y \log(p) + (1 - y) \log(1 - p) \right]
$$

where $y$ is the ground truth value of the label for the current subject.

The gradient is found by taking the derivative of the loss function with respect to $z$:

$$
\frac{dL}{dz} = \frac{dL}{dp} \frac{dp}{dz} = \cdots = p-y
$$

where we have used the chain rule and the result that
$$
\frac{dp}{dz} = \cdots = p(1 - p).
$$

The hessian is found by taking the second derivative:

$$
\frac{d^2L}{dz^2} = \frac{d(p-y)}{dz} = \frac{dp}{dz} = p(1 - p).
$$

The hessian is used for getting an appropriate step size in the direction of the negative gradient, based on how 'curvy' the loss function is at the current point z.

With these expressions, I implemented the XGBoost objective function with an added prioritization on the CHF=1 class. This was done by multiplying the gradient and hessian values associated with each RRI segment by a factor $\alpha>1$ (`alpha`). 

For reasons I don't know, the implementation with a custom loss function for XGBoost didn't work as expected on the real data, even with $\alpha=1$, which would just be the normal implementation of the log loss objective function. The resulting performance was that it classified every single input as CHF=1, meaning zero sensitivity and maximum specificity, for almost the entire range of decision thresholds. 
![Custom loss function, real data, alpha=1.0](/project_heart-disease-prediction/performance_custom_loss_real_data_alpha1.0.png)
Not very good!

Whereas when I used the built-in `'bin:logloss'` option for the objective function, it resulted in a similar performance as before. 
Since it didn't work properly with the real data, I decided to test out a custom loss function on with synthetic data. I took a slightly different approach, using the `xgboost.train()` function rather than the `xgboost.XGBClassifier()` function, with the same custom loss function. If it turned out to work really well for the synthetic data, I could then give it another go with the real data.

The performance on synthetic data for different decision thresholds, with custom loss function with $\alpha=1.0$:
![Custom loss function, synthetic data, alpha=1.0](/project_heart-disease-prediction/performance_custom_loss_synthetic_alpha1.0.png)

And increasing $\alpha$ to 5, 10 and 50, respectively:
![Custom loss function, synthetic data, alpha=5.0](/project_heart-disease-prediction/performance_custom_loss_synthetic_alpha5.0.png)

![Custom loss function, synthetic data, alpha=10.0](/project_heart-disease-prediction/performance_custom_loss_synthetic_alpha10.0.png)

![Custom loss function, synthetic data, alpha=50.0](/project_heart-disease-prediction/performance_custom_loss_synthetic_alpha50.0.png)

The increase in $\alpha$ gives more priority on correcting false positives. We see that it does increases the sensitivity at the default decision threshold, but not without sacrificing specificity. The effect is mainly that the sensitivity and specificity are shifted toward the right as $\alpha$ increases. Though there might be some combinations of $\alpha$ and decision threshold that give a bit better performance, it doesn't seem that there are large performance increases to gain from it. 
Since the performance gains were limited on the synthetic data, I decided to not do it for the real data.

## Feature importance
The XGBoost library comes with the option to estimate the importance of each feature in making its classifications. A higher score means the feature value has more influence on the classifications compared to a feature with a lower score. The importance of a feature can be measured by different metrics. I used the same metric as Wang et al., which was the average information gain (entropy reduction) from the splits where that feature was used. This is specified in the XGBoost function `get_score()` by setting `importance_type="gain"`.

In this section I'll stick to looking at the entire dataset (all DBs), and I'll be using tuned hyperparameters. The feature importance was estimated and is shown in the figure below.

![Feature importance, all DBs](/project_heart-disease-prediction/feature_importance_all_DBs.png)

The deep learning features appear to be the most important for the model predictions compared to the expert features, with the top 8 features being all DL features.

Training the model multiple times, the importance of the various features varied somewhat based on the value of the `random_state` parameter in `xgboost.XGBClassifier()`. For example, with one value of `random_state`, DL feature 18 was ranked 6 in importance, whereas for a different value of `random_state` it wasn't even in the top 20. The feature importance could also change based on what hyperparameter values were used. However, some features did rank quite high in importance consistently, like DL feature 29. 
In any case, it seems that the feature importance can be somewhat volatile, and should be taken with a grain of salt. I'd recommend not concluding hastily that some features are very important or unimportant based on a single XGBoost run.

One thing I wanted to try was to see what happens performance-wise if we train XGBoost with 1) only the top $n$ features (top 20, top 10 and so on), 2) only the deep learning features, and 3) only the expert features.

First, XGBoost with all features, top 20, top 10 and top 5 features:
![Performance results, features: All features, top 20, top 10, top 5](/project_heart-disease-prediction/performance_vs_decision_threshold__features_all_top20_top10_top5.png)

Then the top 3 features, the most important feature (DL feature 29 in this case), the second most important feature (DL feature 5), and a couple arbitrary lower-importance features (media_RR and DL feature 7), in order to see what happens with the performance if using only a very small number of features:
![Performance results, features: Top 3, top 1, DL_feature_5 only, mean_RR and DL_feature_7 only](/project_heart-disease-prediction/performance_vs_decision_threshold__features_top3_top1_etc.png)

And finally DL features only and expert features only:
![Performance results, features: DL features only, expert features only](/project_heart-disease-prediction/performance_vs_decision_threshold__features_DL_only_expert_only.png)

I was surprised to see that the performance was almost exactly the same for all features, top 20 features and all the way down to top 3 and even top 1. The DL features model performed slightly better than the expert features model.

I investigated a bit closer by running a simple logistic regression on some of the same features for comparison. 

### Comparison with logistic regression
For logistic regression I used one feature as input variable at a time. I selected four features of varying importance: DL feature 29 (importance rank 1), DL feature 23 (importance rank 5), DL feature 19 (importance rank 6) and media_RR (importance rank 12). 

![Performance results, logistic regression, various features](/project_heart-disease-prediction/performance_vs_decision_threshold__logistic_regression_various_features.png)

We see quite similar results for the top feature compared to XGBoost with the same feature. The XGBoost performance had more clear discrete jumps in performance as decision threshold is changed compared to the logistic regression performance - this could be due to the fact that XGBoost is a decision tree algorithm, with discrete splits in the feature value resulting in more sudden changes in classifications compared to a continuous method like logistic regression. But in terms of the actual level of performance, they're very close.

Is this result surprising? It was to me at first glance. I did sort of expect that XGBoost would perform better than a simple logistic regression. After thinking about it and looking into it a bit, it can actually make sense that the logistic regression and XGBoost perform similarly well in this context. This is because of the fact that DL features had the highest importance by a solid margin (and were the features mainly compared here when looking at XGBoost vs. logistic regression), and how the neural network that retrieved the DL features was constructed. This connection is explained more closely in the next two paragraphs.

The final layer of the convolutional neural network used here is a linear layer. 
The DL features is the output from forward-passing the data through the CNN *except* for the final layer, so the only thing missing is to train a linear layer with those DL features, i.e. linear regression. 
Using the deep learning features as inputs in a classifier then becomes a situation where ideally we get a linear decision boundary between the two classes, in terms of the correct labels vs. the deep learning features. 
And to be clear: The final layer of the CNN is a linear layer, where the output is interpreted as *logits*. It uses logits rather than actual probabilities during training because of how the neural network was set up. The logit output is converted to probabilities (using the sigmoid function, as we saw earlier) for making classifications when we have the finished model. So it does end up with the same type of output as logistic regression (probabilities).

If the neural network performs well, that means that the input data would have been transformed into a (close to) linear relationship with the output. The final linear layer would then seek to find that linear relationship. In reality, the neural network might not be able to find a perfectly linear relationship, and then it won't be able to fit a straight line to the data in the final layer, and the performance won't be perfect (as is the case here). This is most likely why the expert features were added into the mix, to try to add any missing pieces of correlation that the neural network wasn't able to extract from the direct RRI heart data itself - a form of feature engineering. In our case, it seems that these expert features didn't contain that much correlation with the CHF label compared to what the CNN was able to find. This could explain why the DL features alone do better than the expert features alone. 
We observed that the DL feature with the top importance *by itself* was able to produce a roughly similar level of performance with XGBoost as when using all DL features together. If that's the case, then, by the considerations above, it isn't too surprising after all that that DL feature alone is able to produce nearly the same results with XGBoost vs. a simple logistic regression. 

## Final model and discussion
We can now imagine that we're going to pick a model to put into deployment, to be used as a supportive tool for heart-related diagnosis for doctors or other health professionals.
Based on the various plots produced so far, it seems that XGBoost is a tiny bit better than the CNN alone or logistic regression with the top feature. I could probably do a more rigorous analysis to differentiate which of the features gave the best results, but that seems like it would be overanalyzing things at this point, since their performance levels are quite similar.

XGBoost with the top 5 features seems to perform just as good if not a tiny bit better than the other feature selections, so I'll select that model. After looking at the exact numbers of the performance metrics for different decision thresholds, a threshold value of 0.1 seems to give an appropriate trade-off between sensitivity and specificity overall. The model performance for the various subsets (DB1, DB2, all DBs) was the following:

Features used: Top 5 features (`'DL_feature_29', 'DL_feature_5', 'DL_feature_18', 'DL_feature_12', 'DL_feature_23'`).

Test set performance with threshold=0.1:
| Dataset | Accuracy | Sensitivity | Specificity |
|---------|----------|-------------|-------------|
| DB1     | 97.26%   | 97.28%      | 97.21%      |
| DB2     | 79.25%   | 90.10%      | 68.70%      |
| All DBs | 89.52%   | 94.38%      | 81.84%      |

The specificities dip below 70% for the DB2 group, but the specificity for all DBs is just over 80%. With this choice of threshold, the model does detect over 90% of cases of heart disease, while keeping the overall specificity above 80%.
If the imagined health professionals using this tool were to find that the number of false positives leads to too much follow-up work, perhaps during particularly busy time periods, the threshold of the model in deployment can be bumped up a decimal point or two.

A reminder of the results of Wang et al. for comparison:
| Dataset | Accuracy | Sensitivity | Specificity |
|---------|----------|-------------|-------------|
| DB1     | 99.85%   | 100.00%     | 99.84%      |
| DB2     | 83.84%   | 70.26%      | 98.44%      |

Given that the sensitivity is significantly lower than the specificity in their DB2 results, I'd speculate that they didn't adjust the decision threshold. Their base results with the default threshold, if that's what they were using, was better than the results I got with the default threshold. They could have no doubt significantly improved the sensitivity of their model, and increased its usefulness in terms of usefulness in a clinical setting (especially for DB2), by lowering the decision threshold. In terms of overall accuracy, their presented model was better than my final model by a few percentage points. 

I don't know exactly why my model ended up with a somewhat lower performance than their model. One difference was that I used binary cross entropy for the loss function (`torch.nn.BCEWithLogitsLoss()`), while Wang et al. used mean-square error. To be honest, this difference was because I simply forgot that they had specified the loss function they used in their article. As I read up on tutorials on neural networks for binary classification, the BCE loss came up as a suggestion along with reasonable arguments for why it could be a good choice for a loss function, and I just went with it. I don't believe this choice would end up having a negative effect on model performance, but it's an unknown that might be worth mentioning. 

Some of the discrepancies could also come from the various details that weren't specified in their paper. Details about their setup, like programming language used and what specific deep learning or machine learning package they used. How the model initialization was done, batch size, early stopping criteria, etc. They did say how they did their preprocessing of the data, but maybe there were some details about what they defined e.g. an abnormal heartbeat to be, or something like that - perhaps they ended up with a slightly stricter filter, giving more 'clean' data that was a bit easier to classify. These things might not make a big difference individually, but it can add up.

In any case, it was interesting to see that the expert features weren't even used in the final model I ended up with. All of the top 5 XGBoost features were deep learning features that the convolutional neural network had discovered. A conclusion to draw from this is that a convolutional neural network can extract enough useful information from the RR interval measurements alone to discern whether a person had heart disease or not, at a level that is clinically useful.

## References
1. [1] Goldberger, A., et al. “PhysioBank, PhysioToolkit, and PhysioNet: Components of a new research resource for complex physiologic signals.” *Circulation [Online]* 101 (23), pp. e215–e220 (2000).

2. [2] BIDMC Congestive Heart Failure Database (BIDMC-CHF): **Link:** https://physionet.org/content/chfdb/1.0.0/. **Original article:** Baim, D. S., et al. “Survival of patients with severe congestive heart failure treated with oral milrinone.” *Journal of the American College of Cardiology* 7,3 (1986): 661–70. doi:[10.1016/s0735-1097(86)80478-8](https://doi.org/10.1016/s0735-1097(86)80478-8).

3. [3] Congestive Heart Failure RR Interval Database (CHF-RR): **Link:** https://physionet.org/content/chf2db/1.0.0/

4. [4] MIT-BIH Normal Sinus Rhythm Database (NSR): **Link:** https://physionet.org/content/nsrdb/1.0.0/

5. [5] Normal Sinus Rhythm RR Interval Database (NSR-RR): **Link:** [https://physionet.org/content/nsr2db/1.0.0/](https://physionet.org/content/nsr2db/1.0.0/)

6. [6] Fantasia Database (FD): **Link:** https://physionet.org/content/fantasia/1.0.0/. **Original article:** Iyengar, N., et al. “Age-related alterations in the fractal scaling of cardiac interbeat interval dynamics.” *The American Journal of Physiology* 271,4 Pt 2 (1996): R1078–84. doi:[10.1152/ajpregu.1996.271.4.R1078](https://doi.org/10.1152/ajpregu.1996.271.4.R1078).

7. [7] Gritti, Ivana. (2013). Heart Rate Variability, Standard of Measurement, Physiological Interpretation and Clinical Use in Mountain Marathon Runners during Sleep and after Acclimatization at 3480 m. Journal of Behavioral and Brain Science. 03. 26-48. 10.4236/jbbs.2013.31004. 

8. [8] D. J. Cornforth and H. F. Jelinek, "Detection of Congestive Heart Failure using Renyi entropy," *2016 Computing in Cardiology Conference (CinC)*, Vancouver, BC, Canada, 2016, pp. 669-672. keywords: {Entropy;Electrocardiography;Time measurement;Heart rate variability;Standards;Time-domain analysis},

9. [9] Wikipedia - Detrended fluctuation analysis. https://en.wikipedia.org/wiki/Detrended_fluctuation_analysis

10. [10] Wang, Ludi & Zhou, Wei & Chang, Qing & Chen, Jiangen & Zhou, Xiaoguang. (2019). Deep Ensemble Detection of Congestive Heart Failure Using Short-Term RR Intervals. IEEE Access. PP. 1-1. 10.1109/ACCESS.2019.2912226.

11. [11] Patel BS, Steinberg E, Pfohl SR, Shah NH. Learning decision thresholds for risk stratification models from aggregate clinician behavior. *J Am Med Inform Assoc.* 2021;28(10):2258-2264. doi:10.1093/jamia/ocab159