## Requirements

I want to generate the first features of this plants watering application.

The features are:

- A CRUD for a plant
- A list of plants

Here's the details for each features...

### A CRUD for a plant

This feature is about adding functionalities to Create, Read, Update and Delete a plant.

#### Create

There should be a button to create a new plant from the page listing the existing plants. When clicked, the button should open a modal allowing a user to create a new plant. Once created, the plant should be added to the list and the modal should be closed. The list should be refreshed.

The fields to create a plant are:

| Name              | Display text        | Type    | UI component                       | Required | Default value |
| ----------------- | ------------------- | ------- | ---------------------------------- | -------- | ------------- |
| description       | Description         | String  | TextArea                           | No       | -             |
| family            | Family              | String  | TextInput                          | No       | -             |
| location          | Location            | String  | Select (Location values)           | Yes      | living-room   |
| luminosity        | Luminosity          | String  | Select (Luminosity values)         | Yes      | medium        |
| mistLeaves        | Mist leaves         | Boolean | Switch                             | Yes      | True          |
| soilType          | Soil type           | String  | TextInput                          | No       | -             |
| wateringFrequency | Watering frequency  | String  | Select (Watering frequency values) | Yes      | 1-week        |
| wateringQuantity  | Watering quantity   | String  | TextInput                          | Yes      | -             |
| wateringType      | Watering type       | String  | Select (Watering type values)      | Yes      | surface       |
| firstWateringDate | First watering date | Date    | DatePicker                         | Yes      | Tomorrow      |

When creating a new plant record, the following fields should always be added to the record:

| Name             | Type | Required |
| ---------------- | ---- | -------- |
| creationDate     | Date | Yes      |
| lastUpdateDate   | Date | Yes      |
| nextWateringDate | Date | Yes      |

"firstWateringDate" should not be persisted to the database, but rather use to compute the initial `nextWateringDate` value.

##### Location values

The following location values are possible:

| Id          | Display text |
| ----------- | ------------ |
| basement    | Basement     |
| bathroom    | Bathroom     |
| bedroom     | Bedroom      |
| dining-room | Dining room  |
| living-room | Living room  |
| kitchen     | Kitchen      |

##### Luminosity values

The following luminosity values are possible:

| Id     | Display text |
| ------ | ------------ |
| low    | Low          |
| medium | medium       |
| high   | high         |

##### Watering frequency values

The following watering frequency values are possible:

| Id        | Display text |
| --------- | ------------ |
| 0.5-week  | 0.5 week     |
| 1.5-weeks | 1.5 weeks    |
| 1-week    | 1 week       |
| 2.5-weeks | 2.5 weeks    |
| 2-weeks   | 2 weeks      |

##### Watering type values

The following watering type values are possible:

| Id      | Display text |
| ------- | ------------ |
| deep    | Deep         |
| surface | Surface      |

#### Read and Update

There should be a button to view and edit the information of an existing plant from the page listing the existing plants. Every listed plants should have an inline button allowing the user view or edit the plant. When clicked, the button should open a modal showing the information of the selected plant. The information can be updated as well (except when specified otherwise in the table below). Every inputs should auto-saved when updated. This modal should have buttons to close the modal and delete the plant.

The following information should be shown:

| Name              | Display text        | Type    | UI component                       | Required | Editable |
| ----------------- | ------------------- | ------- | ---------------------------------- | -------- | -------- |
| description       | Description         | String  | TextArea                           | No       | Yes      |
| family            | Family              | String  | TextInput                          | No       | Yes      |
| location          | Location            | String  | Select (Location values)           | Yes      | Yes      |
| luminosity        | Luminosity          | String  | Select (Luminosity values)         | Yes      | Yes      |
| mistLeaves        | Mist leaves         | Boolean | Switch                             | Yes      | Yes      |
| soilType          | Soil type           | String  | TextInput                          | No       | Yes      |
| wateringFrequency | Watering frequency  | String  | Select (Watering frequency values) | Yes      | Yes      |
| wateringQuantity  | Watering quantity   | String  | TextInput                          | Yes      | Yes      |
| wateringType      | Watering type       | String  | Select (Watering type values)      | Yes      | Yes      |
| nextWateringDate  | First watering date | Date    | DatePicker                         | Yes      | No       |

Whenever a plant is updated, the `lastUpdateDate` field must be updated as well.

For the values of the Select UI component, view the previous "Create" section.

#### Delete

There should be a button to delete an existing plant from the page listing the existing plants. Every listed plant should have an inline button allowing the user view to delete the plant. The user should also be able to bulk delete plants from the list. Whever a plant is to be deleted, there should be a confirmation popup first actually deleting the plant. The popup should show the name of the plan to be deleted. If it's a bulk delete operation, there should still be a single popup listing the name of every selected plants. Once completed, the list should be refreshed.

### A list of plants

This page is a list of all the existing plants. The list should use React virtualization to offer a smooth experience and should offer an infinite scrolling experience.

Every item of the list should include:

- The name of the plant
- The watering quantity of the plant
- The watering type of the plant
- The location of the plan
- If the plant is due for watering, it should be mentionned
- The "view or edit" button
- The "delete" button or something for bulk deletes

The should be filterable with the following filters:

| Name              | Display text       | Type    | UI component                       |
| ----------------- | ------------------ | ------- | ---------------------------------- |
| location          | Location           | String  | Select (Location values)           |
| luminosity        | Luminosity         | String  | Select (Luminosity values)         |
| mistLeaves        | Mist leaves        | Boolean | Switch                             |
| soilType          | Soil type          | String  | TextInput                          |
| wateringFrequency | Watering frequency | String  | Select (Watering frequency values) |
| wateringType      | Watering type      | String  | Select (Watering type values)      |
| dueForWatering    | Due for watering   | Boolean | Switch                             |

For the values of the Select UI component, view the previous "Create" section.

The plants should be sorted ascending first by `name`, then `family`, and finally descending by `lastUpdateDate`.

## Technical specifications

### Tanstack DB

The data should queryed and mutated using Tanstack DB (https://tanstack.com/db/latest, https://www.npmjs.com/package/@tanstack/db). The data should be persisted in local storage using https://tanstack.com/db/latest/docs/collections/local-storage-collection.

IMPORTANT: Write meaningful agent instructions about the Tanstack DB setup that future agents should be aware of.

### Shared components

Shared components should be added to `./packages/components`, even if they are not related to shadcn.

### Logo

Create a logo for the app and use it in the layout of the app.

### Seed

Create a reusable seed that creates between 200 and 300 plants using real data.

## Agent skills

Load the `frontend-design` agent skill to help you design the application.
