---
title: "Automated repair of multi-component 3D meshes"
description: Repairing 3D meshes with multiple components for watertightness with minimal disruption of geometries
publishDate: 'Dec 18 2025'
isFeatured: true
seo:
  image:
    src: 'placeholder.png'
---

<!-- Tags: 3d_models, Python, trimesh -->

**Project overview:**

A mesh-repair pipeline in Python for making 3D models reliably watertight with minimal changes to their shapes. The method uses a component-wise and progressive repair approach, which outperforms standard repair functions on multi-component meshes when it comes to preserving the original mesh geometry. 


[_View code on GitHub_](https://github.com/amundwf/3d-mesh-repair)

## Introduction

For some use cases of 3D meshes, it's necessary that the meshes we're working with are watertight. 
'Watertight' in this context means that the mesh, or each separate component of the mesh, is a perfect closed surface, i.e. that there aren't any holes or gaps on any surface. 
In this post I share a method that consistently makes meshes watertight, while also seeking to avoid changing the original shapes more than strictly necessary.

Before getting started with that, let's consider where this could come in handy. 
One type of scenario where you'd need watertight meshes would be use cases where you need to determine whether a point is inside or outside of the mesh. 
For example for getting a spatial distribution of some property, with 3D models representing objects or regions of space where the property should have specific values. 
This could be a physical property in a physics/engineering simulation, radiodensity in various parts of the body for medical physics, or simply a binary mask (solid object vs. air/vacuum) in e.g. computational fluid dynamics. 
Algorithms for determining whether a point in the coordinate system is inside a mesh or not generally require, as far as I'm aware, that the input mesh is watertight if the results are to be reliable. 
This is what led me to put together this mesh repair method. 

This project was originally intended to focus on medical physics, more specifically radiation therapy, and estimating the spatial distribution of radiodensity in a body for that purpose. This is why the 3D models used here are of various organs in the body. 
I decided to change directions, so this post doesn't contain the full finished project that was originally planned. But the mesh repair 'side quest' that came up along the way was still something I found worth sharing.

For this project I used Python, with the [`trimesh`](https://trimesh.org/) library for general handling of the 3D meshes and the [`PyMeshFix`](https://pymeshfix.pyvista.org/) library for repair functions [1, 2]. 
<!-- [ref trimesh, ref PyMeshFix] -->

The original versions of the meshes seen in this post can be found at [[3]](https://3d.nih.gov/collections/hra/hra-male).


## Investigating the meshes

I checked if the various organ meshes were watertight using the trimesh [**`.is_watertight`**](https://trimesh.org/trimesh.base.html#trimesh.base.Trimesh.is_watertight) method. Several of the meshes were not watertight.

For example, the 3D mesh of a heart that I downloaded was non-watertight. 
For reference, here is that original, unrepaired heart mesh:

![Original heart mesh figure 1](/project_3d-meshes-repair/heart_original_1.png)

![Original heart mesh figure 2](/project_3d-meshes-repair/heart_original_2.png)

Looks pretty good on the surface. Still, the mesh isn't watertight, so repairs are needed.

Working with the `trimesh` library in Python, the function to determine whether a point is inside or outside of the mesh is the [**`contains()`** function](https://trimesh.org/trimesh.base.html#trimesh.base.Trimesh.contains).
I wanted to be able to do rough 'visual benchmarks' to see if the results from `contains()` were reasonable.
I did this by color-coding the points classified as inside vs. outside the mesh. This initial visual benchmark was done on the unrepaired, non-watertight meshes. 
I simplified the visuals by making a function that could show selected cuboid (3D rectangular) sub-sections of the point grid, so that it would be possible to see 2D cross sections of points. 
A cross section of the unrepaired heart mesh along with the classified points can be seen in the following images from a few different angles. 

Perspective view: ![Heart mesh cross-section: contains function results, view 1, angle](/project_3d-meshes-repair/contains_test_heart_cross_section_angle_1.png)

Side view: ![Heart mesh cross-section: contains function results, view 2, side](/project_3d-meshes-repair/contains_test_heart_cross_section_angle_2.png)

View facing the cross-section: ![Heart mesh cross-section: contains function results, view 3, facing](/project_3d-meshes-repair/contains_test_heart_cross_section_angle_3.png)

When manually inspecting and navigating around in the heart mesh in the 3D viewer before running `contains()`, I saw that it did have some cavities on the inside. Nothing wrong with that per se; this is true for real hearts as well. These cavities represent non-heart matter, such as blood, so the correct classification would be 'outside' for points in the cavities. 
But it did seem that there were somewhat more of these points classified as outside points than were in actual cavities of the mesh. This could be an indication that there were some false negative classifications returned by `contains()`, which in turn could be because the mesh was not watertight.
In any case, making the meshes watertight should yield more reliable point classifications.


## Fixing the meshes

### First attempts
Some of the repair functions I tested seemed to be too 'careful' to successfully repair the meshes I was working with. For example, the trimesh function [**`fill_holes()`**](https://trimesh.org/trimesh.repair.html) is used to fill single-triangle holes in a triangular mesh. Running that function did not succeed in making any of the meshes watertight. 
In contrast, there were functions that did successfully repair the meshes, at the cost of making more invasive changes. 
For example, the trimesh function [**`convex_hull()`**](https://trimesh.org/trimesh.convex.html) smoothes over all concave parts of a mesh and keeps only that smoothed-over surface layer, resulting in a convex and watertight mesh. Running that with the heart mesh gives the following mesh,

![Convex hull heart](/project_3d-meshes-repair/heart_convex_hull.png)

which kind of looks more like a potato than a heart at that point. 

The PyMeshFix library's [**`MeshFix.repair`**](https://pymeshfix.pyvista.org/_autosummary/_autosummary/pymeshfix.MeshFix.repair.html#pymeshfix.MeshFix.repair) function is a mesh repair function that is consistently successful in making a mesh watertight. The downside is that it in some cases can be pretty aggressive in its repairs. <!-- the downside being its aggressiveness in the repairs.  -->
This function also altered the overall geometry of the mesh quite a bit: 

![Heart mesh after PyMeshFix repair function](/project_3d-meshes-repair/heart_after_pymeshfix.png)

So, these functions do give us watertight meshes, but they're not always that good when it comes to preserving the original shapes.

![W](/project_3d-meshes-repair/w.png)


### A solution: Component-wise and progressive repair

At this point, I investigated the different non-watertight organ meshes some more, and found out that they consisted of many components rather than a single connected mesh. 
I checked the watertightness of all component meshes. Some were watertight and some were not. 

This could be an important detail to consider when it comes to repairing a mesh. It's possible that the geometric deformations observed from the `MeshFix.repair` function has to do with the fact that these meshes consist of multiple components. For complex meshes like anatomical 3D models, such multi-component meshes might be a somewhat common thing to encounter. At the same time, for use cases such as medical applications, there might be little room for sacrificing geometric realisticness. A repair method that can repair such multi-component meshes without messing up the geometry too much would be needed. 

Below are images of the watertight and non-watertight components of the heart mesh separately.

Watertight components:
![Heart mesh, watertight components](/project_3d-meshes-repair/heart_split_components_watertight.png)

Non-watertight components:
![Heart mesh, non-watertight components](/project_3d-meshes-repair/heart_split_components_non_watertight.png)

These non-watertight components are the ones that need to be patched up.

A mesh is watertight if all of its components are watertight, even if they're not directly connected to each other. 
After discovering that the meshes were made up of multiple components, the thought came to mind that a good approach to achieve watertightness would be to keep the watertight components of the mesh as they are, repair the non-watertight components individually ('component-wise repair'), and then put them all back together at the end. This turned out to work much better than running a mesh in its entirety through repair functions. 

In addition to component-wise repair, I also decided to do what I'm here calling 'progressive repair' for repairing each component mesh. This is to attempt the least geometrically invasive mesh repair functions first, and advance to more invasive repair functions only if the previous ones failed. 

Note that the order of the repair functions in terms of invasiveness wasn't determined completely rigorously. I read a bit in the documentations of the various repair functions to get a rough idea of what each function did and how invasive it was likely to be. Then I tested out the functions on various meshes and simply noted that some of them seemed to not alter the overall geometry of the mesh very much (low invasiveness), while others could alter the mesh quite a bit (high invasiveness). 
The order I ended up going with has worked well, at least for the meshes I've been working with here. 


### Final method

The steps of the repair method I developed will be outlined here.

- First, any duplicate vertices are merged, using the function [**`trimesh.Trimesh.merge_vertices()`**](https://trimesh.org/trimesh.grouping.html#trimesh.grouping.merge_vertices). This is done to avoid scenarios where you have a 'sea of individual triangles' where it's supposed to be a continuous mesh.

- The mesh is then split into its individual components, and separated into watertight and non-watertight components. This is done by calling [**`trimesh.Trimesh.split(only_watertight=False)`**](https://trimesh.org/trimesh.base.html#trimesh.base.Trimesh.split).

- Small non-watertight components below some size threshold are discarded. The threshold is adaptive, based on the size of the original full mesh. This is done to get rid of small fragments that prevent watertightness but most likely don't contribute meaningfully to the 3D model.

- Repairs are then attempted on the remaining non-watertight components. Repair invasiveness is progressively increased if needed. There are three tiers of repair invasiveness.

- The first tier calls the functions [**`pymeshfix.PyTMesh.join_closest_components()`**](https://pymeshfix.pyvista.org/_autosummary/_autosummary/pymeshfix.PyTMesh.join_closest_components.html) and [**`pymeshfix.PyTMesh.fill_small_boundaries()`**](https://pymeshfix.pyvista.org/_autosummary/_autosummary/pymeshfix.PyTMesh.fill_small_boundaries.html). 
As their names hint at, `join_closest_components` attempts to join nearby components with open boundaries, and `fill_small_boundaries` fills small boundaries in the mesh that the algorithm interprets as holes. The `join_closest_components` function becomes relevant only in cases where the input mesh has multiple components. 

- The second tier calls [**`pymeshfix.PyTMesh.clean()`**](https://pymeshfix.pyvista.org/_autosummary/_autosummary/pymeshfix.PyTMesh.clean.html), which removes self-intersections and degenerate faces. 

- The third tier calls [`pymeshfix.MeshFix.repair()`](https://pymeshfix.pyvista.org/_autosummary/_autosummary/pymeshfix.MeshFix.repair.html#pymeshfix.MeshFix.repair). This runs the full MeshFix algorithm, which includes most of the functions used in the previous two repair tiers and goes a bit further. It ensures a watertight output mesh in most cases. 

Most likely this will succeed in returning a set of component meshes where all of them are watertight. In the scenario that some of them are still not watertight, there is the option to discard the remaining non-watertight component meshes, keeping only the watertight ones. 
The repaired components are put into a list and returned. 


## Verifying `contains()` functionality

With our now-watertight meshes, we can test how well the `contains()` function is able to correctly classify points as inside or outside of a mesh. 

I tested this with the spinal cord mesh, since it's a relatively simple shape with a clear inside and outside, making it easier to get a rough impression visually of how correct the point classifications are. 

The spinal cord mesh looks like this:
![Spinal cord mesh, repaired](/project_3d-meshes-repair/spinal_cord_mesh_plotly.png)

And here are the points classified as 'inside' only (blue points):
![Points classified as inside the spinal cord mesh, entire mesh](/project_3d-meshes-repair/classified_points_spinal_cord_1.5mm_inside_points_only.png)

There don't seem to be any obvious errors among these classified points. The points reveal the shape of the spinal cord mesh nicely. For reference, the point distance of the grid in this figure was set to 1.5 mm, with the mesh roughly reflecting realistic anatomical length scales. 

Now including outside points as well for parts of the mesh, in some cross-sectional views.

Cross section, view 1:
![Classified points, spinal cord mesh, cross section 1](/project_3d-meshes-repair/classified_points_spinal_cord_1.5mm_slice_1.png)

Closer view of a slightly shifted cross section:
![Classified points, spinal cord mesh, cross section 2](/project_3d-meshes-repair/spinal_cord_points_classified_partial_slice_2.png)

These figures show that, at least from an informal quick visual check, the points inside the mesh seem to for the most part to be correctly classified as inside (blue points), and the points outside of the mesh correctly classified as outside (red points). 

There are some points classified as outside of the mesh that are seemingly inside of the mesh. But these are actually not wrongly classified points, as it turns out. Looking closer at the mesh outline in the second cross section view, we can see these 'disks' separating sections of the spinal cord. This is not an anatomical thing; they're artifacts from the mesh repair method. 
The original spinal cord mesh wasn't completely watertight. There were imperfect connections along the surface, sort of like cylindrical-ish shapes that weren't completely perfectly stacked, leaving small gaps. The mesh was repaired with the method I developed, and in that process, it sealed off each component rather than trying to connect them. The resulting mesh was watertight, though with some minor imperfections. (Some discussion of this limitation in the following section.)

I inspected a number of these points manually in the 3D viewer, and could see that the repaired spinal cord mesh had these seals covering the ends of those cylindrical-ish sections along the mesh. All the outside-classified points I checked were indeed located in narrow 'air pockets' between the seals of adjacent sections of the mesh. 
So the classifications by `contains()` seem to be correct, it's just that the mesh has some minor artifacts from the repair process.


## Room for improvement

Now a bit more on those unnatural 'seals' we saw between adjacent components on one of the repaired meshes. 
One weakness of the approach used above was that it didn't attempt to connect any adjacent components that would naturally fit together. 
As an example, the following image shows one of the non-watertight components of the original heart mesh (left) along with the repaired version (right). 

![Heart mesh component, non-watertight original vs. repaired](/project_3d-meshes-repair/heart_non_watertight_component_vs_repaired_variant.png)

Visually, it seems that the original component is supposed to be connected to some other component(s) of the heart mesh. With this method, it's simply sealed off. That does make it watertight, but the best thing would be if it could be 'welded' back to the component of the mesh that it belongs with. 

An oversight on my part was that I didn't originally put a `join_closest_components` function call before running the component-wise repairs of the mesh. I was concerned at the time that it could lead to geometry losses. However, after some more testing, it did seem to be a low-invasiveness repair function after all, including for multi-component meshes. Additionally, the [documentation of `join_closest_components`](https://pymeshfix.pyvista.org/_autosummary/_autosummary/pymeshfix.PyTMesh.join_closest_components.html) does mention that it "should be run before mesh repair," as an optional extra step before calling `MeshFix.repair`, so it would at least be good to include it as an optional step in the repair pipeline. 
I haven't redone the point classifications and reproduced the figures shown earlier since I'm moving on to other projects, but I did add that modification to the code and did some additional testing on the spinal cord mesh. 

For the testing, there are two 'parameters' we're toggling: 1. Calling `join_closest_components` first or not, and then 2. calling `MeshFix.repair` alone vs. calling my progressive repair function. 
This gives four cases to test in total. 
The figure we saw earlier, with the point classifications and the seals between the cylindrical components of the mesh, is one of these cases. 
The rest of the resulting meshes are displayed below. 

Test 1: Don't call `join_closest_components` first. Call `MeshFix.repair`. 
![No `join_closest_components`. `MeshFix.repair`](/project_3d-meshes-repair/spinal_cord_mesh_repaired_1_only_meshfix_repair_wt.png)

Test 2: Don't call `join_closest_components` first. Call the progressive repair function. (Already done and shown previously)

Test 3: Call `join_closest_components` first. Then call `MeshFix.repair`.
![`join_closest_components` + `MeshFix.repair`](/project_3d-meshes-repair/spinal_cord_mesh_repaired_2_joined_and_meshfix_repair_wt.png)

Test 4: Call `join_closest_components` first. Then call the progressive repair function.
![`join_closest_components` + Progressive repair](/project_3d-meshes-repair/spinal_cord_mesh_repaired_3_joined_and_new_method_repaired_wt.png)

All of the meshes are watertight. 

What we see: The `MeshFix.repair` function used alone (Test 1) returns only one of the many components of the original mesh. This clearly isn't viable, as most of the original mesh is gone. 
Calling `join_closest_components` before `MeshFix.repair` (Test 3) gives significantly better results. The main issue is that there's still a part at the end of the mesh that's missing. There are seals between some components (a bit difficult to see on the figure), but somewhat fewer of them than what we saw from the new method earlier. Though, also slightly more deformations at some points along the surface of the mesh. 
Calling `join_closest_components` and then the progressive repair function (Test 4) returns a complete mesh; no parts missing. There are still some seals between some of the original components, but less than what we saw earlier, where `join_closest_components` was not called first ('Test 2'). 

So, adding `join_closest_components` before going into component-wise repair seems to help for reducing artificial seals between open components that are close to each other. Additionally, the progressive repair method outperforms `MeshFix.repair` alone in terms of preserving geometry, also when `join_closest_components` is called first. 

For the purpose of fixing a mesh in order to have more reliable `contains()` outputs, some extra sealing walls between adjacent components is unlikely to cause much harm, since the volume lost between two adjacent components that are sealed is relatively small. 
The exception to this would be if there's a significant gap between those components, but that would be an issue of the mesh itself missing actual parts, not just an issue of components being disjointed.

However, if for some purposes the mesh needs to be even more true to the real thing, and such seals between adjacent components are unacceptable inaccuracies, this repair method might still not be adequate. 
Calling `join_closest_components` first reduced the occurrence of such seals, but didn't eliminate the issue completely.

A modified method to achieve watertightness without such unnatural seals could maybe be to manually identify which pairs or groups of components 'belong together' in a single component, and then isolate those components and run some repair function that extends/interpolates the meshes to meet each other (even if there's a significant gap between them), becoming one single watertight component. Some more manual work up front, but if such realisticness is needed then that's at least one idea of how to do it.


## Wrapping it up

For multi-component meshes that are not watertight, repairing one component at a time can succeed in providing a watertight mesh, with less unwanted alterations of the overall geometry or shape of the original mesh. 
Attempting less invasive repairs for each component can also further spare the mesh from unnecessary geometry loss, by using repair methods with the minimum effective level of invasiveness that succeed in repairing the mesh. 

The current implementation of the component-wise repair method works well for making a mesh watertight, and it doesn't tend to alter the overall geometry to a noticeable extent. 
One unresolved issue is that unnatural seals can still occur between open components that are close to each other and seemingly supposed to be connected. 

A main take-away from this post is that when repairing a mesh to make it watertight, check if it contains multiple components. If it does, then repairing the mesh one component at a time is something worth considering, since it could preserve the overall geometry of the mesh significantly better. 


## Bonus: Mesh slicing

One of the unfinished things from the original project I was working on involved assembling the 3D models of the organs I was going to include into one scene. Since the 3D models I downloaded weren't completely anatomically correctly positioned or sized in relation to each other, this required resizing, moving and rotating the organ meshes and skin mesh (body surface) to get an anatomically coherent scene.

During this, I needed to see clearly how the meshes are positioned in relation to each other. 
Since the skin mesh naturally covers all of the other organ meshes, one solution is to reduce the opacity of the skin mesh, i.e. making it see-through. I still found the skin mesh to be a bit in the way visually, so I created a function that slices the mesh along a specified plane and keeps only the part on one side of the plane. The plane is defined by a point in space and a normal vector, which is the direction that the plane faces. 

I stopped before finishing assembling and positioning the meshes, but I did get to do some test slicing, resulting in this somewhat amusing view of the skin mesh. I'll leave you with that.

![Skin mesh, sliced](/project_3d-meshes-repair/skin_mesh_sliced.png)


## References

<!-- [ref trimesh] -->
1. [1] trimesh library documentation. https://trimesh.org/trimesh.html

<!-- [ref PyMeshFix] -->
2. [2] PyMeshFix library documentation. https://pymeshfix.pyvista.org/

<!-- [ref 3D models] -->
3. [3] Human Reference Atlas 3D Reference Object Library, Male. https://3d.nih.gov/collections/hra/hra-male
