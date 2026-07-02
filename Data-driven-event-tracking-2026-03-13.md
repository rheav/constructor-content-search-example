# Data-driven event tracking

**Source:** https://docs.constructor.com/docs/integrating-with-constructor-behavioral-tracking-data-driven-event-tracking
**Saved:** 2026-03-13T14:16:54.312Z

*Generated with [markdown-printer](https://github.com/levz0r/markdown-printer) (v1.1.1) by [Lev Gelfenbuim](https://lev.engineer)*

---

Behavioral tracking plays an important role in utilizing Constructor's full potential. The behavioral data we capture helps us generate learnings and is used to re-rank and personalize results for the end user.

We have observed that utilizing a data-driven approach helps to insulate from breakage when compared to using more traditional CSS selectors. This also ensures easy observability of what data is being utilized by Constructor to inform our ML platform.

The following sections outline the different data attributes that need to be surfaced for each product to take advantage of all of Constructor's beacon tracking features.

# 

Autocomplete

[](#autocomplete)

Please surface the following data attributes for the elements specified below:

> 📘
> 
> ### 
> 
> Note
> 
> [](#note)
> 
> Exposing of data attributes is not required if making use of Constructor's open source [Autocomplete UI library](https://github.com/Constructor-io/constructorio-ui-autocomplete) - tracking is automatically handled as part of the library capabilities.

## 

Form element

[](#form-element)

Add the following data attribute to the form element that is the parent of the input element where the user types their search query:

```
data-cnstrc-search-form
```

## 

Search input

[](#search-input)

Add the following data attribute to the input element where the user types their search query:

```
data-cnstrc-search-input
```

## 

Search submit button

[](#search-submit-button)

Add the following data attribute to the element (typically a button) that submits the user's search query:

```
data-cnstrc-search-submit-btn
```

## 

Results list container

[](#results-list-container)

Add the following data attribute to the parent container housing autocomplete results:

```
data-cnstrc-autosuggest
```

## 

Result item

[](#result-item)

Add the following data attributes to each suggestion result item within the autocomplete container:

```
data-cnstrc-item-section="[section name]"
data-cnstrc-item-name="[item name]"
data-cnstrc-item-id="[item id]" // conditionally included - see notes below
data-cnstrc-item-group="[item group id]" // conditionally included - see notes below
data-cnstrc-sl-campaign-id="[sponsored listing campaign id]" // conditionally included - see notes below
data-cnstrc-sl-campaign-owner="[sponsored listing campaign owner]" // conditionally included - see notes below
```

-   Section names pertain to the different sections within an index (case sensitive). For example, "Search Suggestions" or "Products"
-   `data-cnstrc-item-id` should be omitted for results in the "Search Suggestions" section but included for results in all other sections.
-   `data-cnstrc-item-group` is only applicable to "Search in Category" results and should otherwise not be included
-   Item names and IDs should match with the values being supplied within the catalog files being supplied to Constructor.
-   `data-cnstrc-sl-campaign-id` should be populated only if the item is a part of a sponsored listing campaign. This ID can be within the response at `sections.[SECTION_NAME][index].labels.sl_campaign_id`
-   `data-cnstrc-sl-campaign-owner` should be populated only if the item is a part of a sponsored listing campaign. This information can be found within the response at `sections.[SECTION_NAME][index].labels.sl_campaign_owner`

## 

Example markup

[](#example-markup)

### 

Search input

[](#search-input-1)

```
<form 
  id="search-form"
  method="get"
  action="/search"
  data-cnstrc-search-form
>
  <input
    class="search-input"
    type="text"
    placeholder="Search for products"
    autocomplete="off"
    data-cnstrc-search-input
  />
  <button
    class="search-submit-button"
    type="submit"
    data-cnstrc-search-submit-btn
  >
    <i class="fas fa-search"></i>
  </button>
</form>
```

### 

Autocomplete

[](#autocomplete-1)

```
<div id="autosuggest" data-cnstrc-autosuggest>
  <ul class="search-suggestions">
    <li
      class="search-suggestion"
      data-cnstrc-item-section="Search Suggestions"
      data-cnstrc-item-name="apple"
      data-cnstrc-item-group="fruits-vegetables"
    >
      <a href="https://www.example.com/search?q=apple&filters[group_id]=fruits-vegetables">
        <span>apple in Fruits / Vegetables</span>
      </a>
    </li>
    <li
      class="search-suggestion"
      data-cnstrc-item-section="Search Suggestions"
      data-cnstrc-item-name="apple"
    >
      <a href="https://www.example.com/search?q=apple">
        <span>apple</span>
      </a>
    </li>
    ...
  </ul>
  <ul class="product-suggestions">
    <li
      class="product-suggestion"
      data-cnstrc-item-section="Products"
      data-cnstrc-item-name="Organic Fuji Apples"
      data-cnstrc-item-id="product_id_1"
    >
      <a href="https://www.example.com/product/product_id_1">
        <img src="https://www.example.com/images/product_id_1.png">
        <span>Organic Fuji Apples</span>
      </a>
    </li>
    ...
  </ul>
  ...
</div>
```

# 

Search, browse & generic results

[](#search-browse--generic-results)

Please surface the following data attributes for the elements specified below:

## 

Results list container (search)

[](#results-list-container-search)

Add the following data attribute to the element that contains all of the search result items:

```
data-cnstrc-search
data-cnstrc-search-term="[search query]"
data-cnstrc-zero-result // conditionally included - see notes below
data-cnstrc-section="[section]" // conditionally included - see notes below
data-cnstrc-result-id="[result id]"
data-cnstrc-num-results="[total number of results]"
data-cnstrc-result-page="[current page number of results]"
```

-   `data-cnstrc-search-term` contains the search query for which the current search results are displayed.
-   `data-cnstrc-zero-result` should be populated only on zero results pages. It should not be populated if the page is still loading or a request to retrieve product results is still in progress. The rest of the results list container data attributes should also still be populated on zero results pages.
-   `data-cnstrc-section` should be populated if the section is not `Products`
-   The value for `data-cnstrc-result-id` is available in Constructor's API responses under `response.result_id`

## 

Results list container (browse)

[](#results-list-container-browse)

Add the following data attributes to the element that contains all of the browse result items:

```
data-cnstrc-browse
data-cnstrc-zero-result // conditionally included - see notes below
data-cnstrc-section="[section]" // conditionally included - see notes below
data-cnstrc-result-id="[result id]"
data-cnstrc-num-results="[total number of results]"
data-cnstrc-result-page="[current page number of results]"
data-cnstrc-filter-name="[filter name]"
data-cnstrc-filter-value="[filter value]"
```

-   `data-cnstrc-zero-result` should be populated only on zero results pages. It should not be populated if the page is still loading or a request to retrieve product results is still in progress. The rest of the results list container data attributes should also still be populated on zero results pages.
-   `data-cnstrc-section` should be populated if the section is not `Products`
-   `data-cnstrc-filter-name` contains the filter name being used in the browse request to power the product listing page. Possible values are: "group\_id," "collection\_id," or "\[facet\_name\]" where the facet name corresponds with a facet defined within the catalog files. For example, "brand." If the results are not powered by Constructor, `group_id` can be used as the filter name.
-   `data-cnstrc-filter-value` contains filter value that's being used in the browse request to power the product listing page. For example, "men-jeans."
-   The values defined for filter name and filter value should correspond exactly to the values being supplied with browse requests to Constructor. An browse request URL typically follows the pattern: `/browse/[filter-name]/[filter-value]`, ex: `/browse/group_id/mens-jeans`
-   The value for `data-cnstrc-result-id` is available in Constructor's API responses under `response.result_id`

## 

Results list container (generic results)

[](#results-list-container-generic-results)

Generic results pages are product listing pages that don't fall under search or browse categories. These pages may include custom-curated collections, promotional landing pages, or other product listings that are not powered by Constructor's search or browse APIs.

Add the following data attributes to the element that contains all of the generic result items:

```
data-cnstrc-generic-results
data-cnstrc-num-results="[total number of results]"
```

## 

Result item

[](#result-item-1)

Add the following data attributes to each result item within the search, browse or generic results container:

```
data-cnstrc-item-id="[item id]"
data-cnstrc-item-name="[item name]"
data-cnstrc-item-variation-id="[variation id]" // conditional - see notes below
data-cnstrc-item-price="[item price]" // conditional - see notes below
data-cnstrc-sl-campaign-id="[sponsored listing campaign id]" // conditionally included - see notes below
data-cnstrc-sl-campaign-owner="[sponsored listing campaign owner]" // conditionally included - see notes below
```

-   `data-cnstrc-item-variation-id` should be populated only if there is a face out variation shown or selected.
    -   For results that display swatches (that is, colors), this value should be updated accordingly if the product URL the user would be redirected to changes when interacting with swatches.
    -   If results are powered by Constructor, this value should default to the `variation_id` surfaced on the result level - located within the response at `response.results[index].data.variation_id`.
-   `data-cnstrc-item-price` should be populated only if there is a conversion / call to action button available for interaction (such as add to cart, add to wishlist, etc.). The value should be numeric - the minimum between the sale price (if available) and the retail (or MSRP) price.
-   `data-cnstrc-sl-campaign-id` should be populated only if the item is a part of a sponsored listing campaign. This ID can be within the response at `response.results[index].labels.sl_campaign_id`
-   `data-cnstrc-sl-campaign-owner` should be populated only if the item is a part of a sponsored listing campaign. This information can be found within the response at `response.results[index].labels.sl_campaign_owner`

## 

Conversion / call to action buttons

[](#conversion--call-to-action-buttons)

Add the following data attributes to any conversion or call to action buttons within the result item container:

```
data-cnstrc-btn="[conversion type]"
```

The following values may be used for `[conversion type]`:

-   `add_to_cart`
-   `add_to_wishlist`
-   `like`
-   `message`
-   `make_offer`
-   `read`

For CTA buttons not covered by the default options, a custom conversion type may be specified to capture the desired interaction.

## 

Example markup

[](#example-markup-1)

If the product has multiple variations that can be selected, please make sure to update `data-cnstrc-item-variation-id` to reflect the correct variation when the user updates their selection.

### 

Search

[](#search)

```
<div
  class="search-results-grid"
  data-cnstrc-search
  data-cnstrc-search-term="apple"
  data-cnstrc-result-id="aabae837-bd93-4d98-8c81-36f8754419cb"
  data-cnstrc-num-results="246"
	data-cnstrc-result-page="1"
>
  <div
    class="search-result"
    data-cnstrc-item-id="product_371823"
    data-cnstrc-item-name="Organic Honeycrisp Apple"
    data-cnstrc-item-variation-id="product_371823_A1"
  >
  	<a href="https://www.example.com/product/product_371823">
    	<img src="https://www.example.com/images/product_371823.png"/>
      <span>Organic Honeycrisp Apple</span>
    </a>
   	<button class="add-to-wishlist" type="button" data-cnstrc-btn="add_to_wishlist">Add to wishlist</button>
    <button class="add-to-cart" type="button" data-cnstrc-btn="add_to_cart">Add to cart</button>
  </div>
  ...
</div>
```

### 

Browse

[](#browse)

```
<div
  class="browse-results-grid"
  data-cnstrc-browse
  data-cnstrc-result-id="aabae837-bd93-4d98-8c81-36f8754419cb"
  data-cnstrc-num-results="246"
	data-cnstrc-result-page="1"
  data-cnstrc-filter-name="group_id"
  data-cnstrc-filter-value="fruits"
>
  <div
    class="browse-result"
    data-cnstrc-item-id="product_371823"
    data-cnstrc-item-name="Organic Honeycrisp Apple"
    data-cnstrc-item-variation-id="product_371823_A1"
  >
    <a href="https://www.example.com/product/product_371823">
      <img src="https://www.example.com/images/product_371823.png"/>
      <span>Organic Honeycrisp Apple</span>
    </a>
    <button class="add-to-wishlist" type="button" data-cnstrc-btn="add_to_wishlist">Add to wishlist</button>
    <button class="add-to-cart" type="button" data-cnstrc-btn="add_to_cart">Add to cart</button>
  </div>
  ...
</div>
```

### 

Generic results

[](#generic-results)

```
<div
  class="generic-results-grid"
  data-cnstrc-generic-results
  data-cnstrc-num-results="48"
>
  <div
    class="generic-result"
    data-cnstrc-item-id="product_371823"
    data-cnstrc-item-name="Organic Honeycrisp Apple"
    data-cnstrc-item-variation-id="product_371823_A1"
  >
    <a href="https://www.example.com/product/product_371823">
      <img src="https://www.example.com/images/product_371823.png"/>
      <span>Organic Honeycrisp Apple</span>
    </a>
    <button class="add-to-wishlist" type="button" data-cnstrc-btn="add_to_wishlist">Add to wishlist</button>
    <button class="add-to-cart" type="button" data-cnstrc-btn="add_to_cart">Add to cart</button>
  </div>
  ...
</div>
```

## 

Exposing request object and result ID

[](#exposing-request-object-and-result-id)

In addition to the data attributes preceding, when Constructor is powering search or browse results, the `request` object and the `result_id` from Constructor's API response should be surfaced on the product listing pages as a JSON string within a `cnstrc-data`script tag.

This script tag should **only** be surfaced on search or browse product listing pages where results are powered by Constructor and not supplied on any other pages.

> 📘
> 
> ### 
> 
> Note
> 
> [](#note-1)
> 
> Exposing of the script tag is **not** required if making use of Constructor's open source [JavaScript client library](https://github.com/Constructor-io/constructorio-client-javascript) - tracking is automatically handled as part of the library capabilities.

```
<script id="cnstrc-data" type="application/json">
  {
    "request": { ... },
    "result_id": "<result_id>",
  }
</script>
```

# 

Related searches

[](#related-searches)

Please surface the following data attributes for the elements specified below:

## 

Related search container

[](#related-search-container)

Add the following data attribute to the element that contains all of the related search terms:

```
data-cnstrc-related-searches
```

## 

Related search item

[](#related-search-item)

Add the following data attribute to each related search term within the related searches container:

```
data-cnstrc-related-search-term="[search term]"
```

-   The value for `data-cnstrc-related-search-term` should contain the actual search term that will be submitted when clicked. For example, `data-cnstrc-related-search-term="chocolate"`

## 

Example markup

[](#example-markup-2)

```
<div class="related-searches" data-cnstrc-related-searches>
  <h3>Related searches</h3>
  <div class="related-search-list">
    <a
      href="https://www.example.com/search?q=dark%20chocolate"
      class="related-search-link"
      data-cnstrc-related-search-term="dark chocolate"
    >
      dark chocolate
    </a>
    <a
      href="https://www.example.com/search?q=milk%20chocolate"
      class="related-search-link"
      data-cnstrc-related-search-term="milk chocolate"
    >
      milk chocolate
    </a>
    <a
      href="https://www.example.com/search?q=white%20chocolate"
      class="related-search-link"
      data-cnstrc-related-search-term="white chocolate"
    >
      white chocolate
    </a>
  </div>
</div>
```

# 

Recommendations

[](#recommendations)

Please surface the following data attributes for the elements specified below:

## 

Results list container

[](#results-list-container-1)

Add the following data attributes to the element that contains the recommendations results:

```
data-cnstrc-recommendations
data-cnstrc-recommendations-pod-id="[pod id]"
data-cnstrc-result-id="[result id]"
data-cnstrc-num-results="[total number of results]"
data-cnstrc-recommendations-seed-items="[item id]"
```

-   The pod ID for `data-cnstrc-recommendations-pod-id` is available in Constructor's API response under `response.pod.id` and also defined within the Customer Dashboard. For example, `data-cnstrc-recommendations-pod-id="pdp_complementary_items"`
-   The result ID for `data-cnstrc-result-id` is available on the top level data in Constructor's API response.
-   `data-cnstrc-num-results` should contain the total number of results returned from Constructor's API response.
-   `data-cnstrc-recommendations-seed-items` should contain all `item_ids` used to request recommendations when the pod strategy requires it. If multiple ids were used, add them with comma-separated strings. For example, `data-cnstrc-recommendations-seed-items="product_100,product_200"`

## 

Result item

[](#result-item-2)

Add the following data attributes to each result item within the recommendations results container:

```
data-cnstrc-item="recommendation"
data-cnstrc-item-id="[item id]"
data-cnstrc-item-name="[item name]"
data-cnstrc-item-variation-id="[variation id]"
data-cnstrc-strategy-id="[strategy id]"
data-cnstrc-item-price="[item price]" // conditional - see notes below
data-cnstrc-item-section"[section name]" // conditional - see notes below
```

-   `data-cnstrc-item-variation-id` should be populated only if there is a face out variation shown or selected.
    -   For results that display swatches (that is, colors), this value should be updated accordingly if the product URL the user would be redirected to changes when interacting with swatches.
    -   If results are powered by Constructor, this value should default to the `variation_id` surfaced on the result level - located within the response at `response.results[index].data.variation_id`.
-   The strategy ID for `data-cnstrc-strategy-id` is available in Constructor's API response under `response.results[index].strategy.id`. For example, `data-cnstrc-strategy-id="complementary_items"`.
-   `data-cnstrc-item-price` should be populated only if there is a conversion / call to action button available for interaction (such as add to cart, add to wishlist, etc.). The value should be numeric - the minimum between the sale price (if available) and the retail (or MSRP) price.
-   `data-cnstrc-item-section` should be populated when recommendations are used to power zero-state autosuggest results (i.e. when results are shown as soon as the user focuses on the search bar without entering a query). This value is typically either `Products` or `Search Suggestions`, and corresponds to the `request.section` field in Constructor's API response.

## 

Conversion / call to action buttons

[](#conversion--call-to-action-buttons-1)

Add the following data attributes to any conversion or call to action buttons within the result item container:

```
data-cnstrc-btn="[conversion type]"
```

The following values may be used for `[conversion type]`:

-   `add_to_cart`
-   `add_to_wishlist`
-   `like`
-   `message`
-   `make_offer`
-   `read`

For CTA buttons not covered by the default options, a custom conversion type may be specified to capture the desired interaction.

## 

Example markup

[](#example-markup-3)

If the item has multiple variations that can be selected, please make sure to update `data-cnstrc-item-variation-id` to reflect the correct variation when the user updates their selection.

```
<div
  class="recommendations-carousel"
  data-cnstrc-recommendations
  data-cnstrc-recommendations-pod-id="pdp_complementary_items"
  data-cnstrc-num-results="10"
  data-cnstrc-result-id="aabae837-bd93-4d98-8c81-36f8754419cb"
  data-cnstrc-recommendations-seed-items="product_220909"
>
  <div
    class="recommendation"
    data-cnstrc-item="recommendation"
    data-cnstrc-item-id="product_778787"
    data-cnstrc-item-name="Short Sleeve Shirt"
    data-cnstrc-item-variation-id="829391312"
    data-cnstrc-strategy-id="complementary_items"
  >
    <a href="https://www.example.com/product/product_778787">
      <img src="https://www.example.com/images/product_778787.png"/>
      <span>Short Sleeve Shirt</span>
    </a>
    <button class="add-to-wishlist" type="button" data-cnstrc-btn="add_to_wishlist">Add to wishlist</button>
    <button class="add-to-cart" type="button" data-cnstrc-btn="add_to_cart">Add to cart</button>
  </div>
  ...
</div>
```

# 

Product detail pages

[](#product-detail-pages)

Product detail pages can take many forms, including things such as "Quick Shop," "Quick View" linked from product listing pages. Please surface the following data attributes for the elements specified below for all product detail views:

## 

Detail container

[](#detail-container)

Add the following data attributes to the element containing the product details:

```
data-cnstrc-product-detail
data-cnstrc-item-id="[item id]"
data-cnstrc-item-variation-id="[variation id]"
data-cnstrc-item-name="[item name]"
data-cnstrc-item-price="[item price]"
```

-   `data-cnstrc-item-variation-id` should be populated only if there is a face out variation shown or selected.
    -   For results that display swatches (that is, colors), this value should be updated accordingly if the product URL the user would be redirected to changes when interacting with swatches.
    -   If results are powered by Constructor, this value should default to the `variation_id` surfaced on the result level - located within the response at `response.results[index].data.variation_id`.
-   `data-cnstrc-item-price` should be populated only if there is a conversion / call to action button available for interaction (such as add to cart, add to wishlist, etc.) - this is generally the case on most product detail pages. The value should be numeric - the minimum between the sale price (if available) and the retail (or MSRP) price.

## 

Conversion / call to action buttons

[](#conversion--call-to-action-buttons-2)

Add the following data attributes to any conversion or call to action buttons within the result item container:

```
data-cnstrc-btn="[conversion type]"
```

The following values may be used for `[conversion type]`:

-   `add_to_cart`
-   `add_to_wishlist`
-   `like`
-   `message`
-   `make_offer`
-   `read`

For CTA buttons not covered by the default options, a custom conversion type may be specified to capture the desired interaction.

## 

Example markup

[](#example-markup-4)

If the item has multiple variations that can be selected, please make sure to update `data-cnstrc-item-variation-id` to reflect the correct variation when the user updates their selection.

```
<div
  id="product-detail"
  data-cnstrc-product-detail
  data-cnstrc-item-id="849291"
  data-cnstrc-item-variation-id="849291_42312"
  data-cnstrc-item-name="Relaxed Jogger"
  data-cnstrc-item-price="14.99"
>
  <div class="section">
    <h3>Relaxed Jogger</h3>
    <img src="https://www.example.com/images/product_849291.png">
    <span class="price">$19.99</span>
    <span class="sale-price">$14.99</span>
  </div>
  <button class="add-to-wishlist" type="button" data-cnstrc-btn="add_to_wishlist">Add to wishlist</button>
  <button class="add-to-cart" type="button" data-cnstrc-btn="add_to_cart">Add to cart</button>
</div>
```

# 

Order details / purchase confirmation page

[](#order-details--purchase-confirmation-page)

Information about the order should be surfaced on the order details (purchase confirmation) page in either a variable in the browser `window` object, or a `script` tag. If using the `window` object, the data should be scoped under the `cnstrc` variable and surfaced as follows:

```
window.cnstrc = window.cnstrc || {};
window.cnstrc.purchaseData = {
    items: [
        {
            item_id: '6501SB',
            variation_id: '387758',
            count: 1,
            price: 10,
        },
        ...
     ],
     order_id: '1AZ0941',
     revenue: 82.48,
};
```

-   `item_id` should be the id of the item purchased. This id should match what is sent in the constructor catalog.
-   `variation_id` should only be included if a specific item variation was purchased. This id should match what is sent in the constructor catalog.
-   `count` should be the quantity of the item purchased
-   `price` should be the price of a single unit of the purchased item
-   `order_id` should be a unique order identifier
-   `revenue` should be a numeric value that represents either the purchase subtotal or the total amount including taxes, discounts, etc. It should match what is tracked within any relevant analytics platforms.

Access to a QA, development, or production environment along with a test account and payment info will be needed to set up tracking.

# 

Quizzes

[](#quizzes)

Please surface the following data attributes for the elements specified below:

> 📘
> 
> ### 
> 
> Note
> 
> [](#note-2)
> 
> Exposing of data attributes is not required if making use of Constructor's open source [Quizzes UI library](https://github.com/Constructor-io/constructorio-ui-quizzes) - tracking is automatically handled as part of the library capabilities.

## 

Results list container

[](#results-list-container-2)

Add the following data attribute to the element that contains all of the quizzes result items:

```
data-cnstrc-quizzes
data-cnstrc-quiz-id="[quiz id]"
data-cnstrc-quiz-version-id="[version id]"
data-cnstrc-quiz-session-id="[session id]"
data-cnstrc-result-id="[result id]"
data-cnstrc-num-results="[total number of results]"
```

-   `data-cnstrc-num-results` should contain the total number of results returned from Constructor's API response and can be located at `response.total_num_results` within the Quizzes API response.

## 

Result item

[](#result-item-3)

Add the following data attributes to each result item within the quizzes results container:

```
data-cnstrc-item-id="[item id]"
data-cnstrc-item-name="[item name]"
data-cnstrc-item-variation-id="[variation id]" // conditional - see notes below
data-cnstrc-item-price="[item price]"
```

-   `data-cnstrc-item-variation-id` should be populated only if there is a face out variation shown or selected.
    -   For results that display swatches (that is, colors), this value should be updated accordingly if the product URL the user would be redirected to changes when interacting with swatches.
    -   If results are powered by Constructor, this value should default to the `variation_id` surfaced on the result level - located within the response at `response.results[index].data.variation_id`.
-   `data-cnstrc-item-price` should be populated only if there is a conversion / call to action button available for interaction (such as add to cart, add to wishlist, etc.). The value should be numeric - the minimum between the sale price (if available) and the retail (or MSRP) price.

## 

Conversion / call to action buttons

[](#conversion--call-to-action-buttons-3)

Add the following data attributes to any conversion or call to action buttons within the result item container:

```
data-cnstrc-btn="[conversion type]"
```

The following values may be used for `[conversion type]`:

-   `add_to_cart`
-   `add_to_wishlist`
-   `like`
-   `message`
-   `make_offer`
-   `read`

For CTA buttons not covered by the default options, a custom conversion type may be specified to capture the desired interaction.

## 

Example markup

[](#example-markup-5)

```
<div
  class="quiz-results-grid"
  data-cnstrc-quizzes
  data-cnstrc-quiz-id="my_quiz_id"
  data-cnstrc-quiz-version-id="11db5ac7-67e1-4000-9000-414d8425cab3"
  data-cnstrc-quiz-session-id="31f6bdae-6f1d-482f-b37f-f7a9e346973a"
  data-cnstrc-result-id="5fd4ddbb-f2ff-4430-8cd9-bad4b0fdc2b7"
  data-cnstrc-num-results="20"
>
  <div
    class="quiz-result-item"
    data-cnstrc-item-id="product_371823"
    data-cnstrc-item-name="Organic Honeycrisp Apple"
    data-cnstrc-item-variation-id="product_371823_A1"
    data-cnstrc-item-price="14.99"
  >
    <a href="https://www.example.com/product/product_371823">
      <img src="https://www.example.com/images/product_371823.png"/>
      <span>Organic Honeycrisp Apple</span>
    </a>
  	<button class="add-to-wishlist" type="button" data-cnstrc-btn="add_to_wishlist">Add to wishlist</button>
  	<button class="add-to-cart" type="button" data-cnstrc-btn="add_to_cart">Add to cart</button>
  </div>
  ...
</div>
```

# 

AI Shopping Agent

[](#ai-shopping-agent)

Please surface the following data attributes for the elements specified below:

## 

Agent result list container

[](#agent-result-list-container)

Add the following data attributes to the ASA result container:

```
data-cnstrc-agent
data-cnstrc-intent="[ASA request intent]"
data-cnstrc-intent-result-id="[ASA request result id]"
data-cnstrc-search-result-count="[total number of search results loaded]"
```

-   `data-cnstrc-intent="[user intent]"` should contain the intent (query) of the ASA request.
-   `data-cnstrc-intent-result-id="[intent result id]"`
    -   Can be retrieved from the `response.intent_result_id` field of each data segment
-   `data-cnstrc-search-result-count="[total number of search results]"` should contain the number of different search query results loaded.
    -   ASA responses contain results for multiple different queries (terms). This attribute should be the number of distinct query results loaded, not the number of items loaded per query.

## 

Agent search result container

[](#agent-search-result-container)

Add the following data attributes to each ASA search result list container:

```
data-cnstrc-agent-search
data-cnstrc-agent-search-result-id="[ASA search query result id]"
data-cnstrc-num-results="[total number of results loaded]"
```

-   `data-cnstrc-agent-search-result-id="[agent search result id]"`
    -   Can be retrieved from the `response.result_id` field of each data segment
-   `data-cnstrc-num-results="[total number of results]"`
    -   The total number of results (items) returned for this search query result.

## 

Result item

[](#result-item-4)

Add the following data attributes to each result item within the Agent search result container

```
data-cnstrc-item-id="[item id]"
data-cnstrc-item-name="[item name]"
data-cnstrc-item-variation-id="[variation id]" // conditional - see notes below
data-cnstrc-item-price="[item price]" // conditional - see notes below
```

-   `data-cnstrc-item-variation-id` should be populated only if there is a face out variation shown or selected.
    -   For results that display swatches (that is, colors), this value should be updated accordingly if the product URL the user would be redirected to changes when interacting with swatches.
    -   If results are powered by Constructor, this value should default to the `variation_id` surfaced on the result level - located within the response at `response.results[index].data.variation_id`.
-   `data-cnstrc-item-price` should be populated only if there is a conversion / call to action button available for interaction (such as add to cart, add to wishlist, etc.). The value should be numeric - the minimum between the sale price (if available) and the retail (or MSRP) price.

## 

Conversion / call to action buttons

[](#conversion--call-to-action-buttons-4)

Add the following data attributes to any conversion or call to action buttons within the result item container:

```
data-cnstrc-btn="[conversion type]"
```

The following values may be used for `[conversion type]`:

-   `add_to_cart`
-   `add_to_wishlist`
-   `like`
-   `message`
-   `make_offer`
-   `read`

For CTA buttons not covered by the default options, a custom conversion type may be specified to capture the desired interaction.

### 

Example markup

[](#example-markup-6)

```
<div
  class="agent-results-grid"
  data-cnstrc-agent
  data-cnstrc-intent="Show me picnic recommendations"
  data-cnstrc-intent-result-id="5fd4ddbb-f2ff-4430-8cd9-bad4b0fdc2b7"
  data-cnstrc-search-result-count="2"
>
  <div
    class="agent-search-result-grid"
    data-cnstrc-agent-search
    data-cnstrc-agent-search-result-id="1f2sdA-f2ff-4430-8cd9-bad4b0fdc2b7"
    data-cnstrc-num-results=5
  >
    <div
      class="agent-search-result"
      data-cnstrc-item-id="product_371823"
      data-cnstrc-item-name="Organic Honeycrisp Apple"
      data-cnstrc-item-variation-id="product_371823_A1"
    >
      <a href="https://www.example.com/product/product_371823">
        <img src="https://www.example.com/images/product_371823.png"/>
        <span>Organic Honeycrisp Apple</span>
      </a>
      <button class="add-to-wishlist" type="button" data-cnstrc-btn="add_to_wishlist"/>
      <button class="add-to-cart" type="button" data-cnstrc-btn="add_to_cart"/>
    </div>
  </div>
  <div
    class="agent-search-result-grid"
    data-cnstrc-agent-search
    data-cnstrc-agent-search-result-id="2SDFEg-f2ff-4430-8cd9-bad4b0fdc2b7"
    data-cnstrc-num-results=5
  >
    <div
      class="agent-search-result"
      data-cnstrc-item-id="product_371823"
      data-cnstrc-item-name="Organic Ham Sandwhich"
      data-cnstrc-item-variation-id="product_371845_A1"
    >
      <a href="https://www.example.com/product/product_371823">
        <img src="https://www.example.com/images/product_371823.png"/>
        <span>Organic Ham Sandwhich</span>
      </a>
      <button class="add-to-wishlist" type="button" data-cnstrc-btn="add_to_wishlist"/>
      <button class="add-to-cart" type="button" data-cnstrc-btn="add_to_cart"/>
    </div>
  </div>
</div>
```

# 

Product Insights Agent (PIA)

[](#product-insights-agent-pia)

Product Insights Agent (PIA) is an AI-powered Q&A widget that lives on Product Detail Pages (PDP), allowing users to ask questions about a product. The widget shows a container with suggested questions, an input field for open-text questions, answers that appear after questions are asked, and feedback buttons on answers.

Please surface the following data attributes for the elements specified below:

> 📘
> 
> ### 
> 
> Note
> 
> [](#note-3)
> 
> Product data (`item_id`, `item_name`, `variation_id`) is read from the nearest `[data-cnstrc-product-detail]` element on the existing (same) page. There is no need to duplicate these on the PIA container.

## 

PIA container

[](#pia-container)

Add the following data attribute to the outermost PIA widget element:

```
data-cnstrc-pia
```

This identifies the PIA widget container and is used for view and out-of-view tracking.

## 

PIA input

[](#pia-input)

Add the following data attribute to the text input where users type free-form questions:

```
data-cnstrc-pia-input
```

This tracks focus and question submission (via Enter key).

## 

PIA submit button _(optional)_

[](#pia-submit-button-optional)

Add the following data attribute to the button that submits a typed question:

```
data-cnstrc-pia-submit-btn
```

If absent, submission is tracked only via Enter key on the input.

## 

PIA suggested questions

[](#pia-suggested-questions)

Add the following data attribute to each clickable suggested question element within the PIA container:

```
data-cnstrc-pia-question
```

The element's text content is used as the question value.

## 

PIA answer

[](#pia-answer)

Add the following data attribute to the element where an AI-generated answer appears:

```
data-cnstrc-pia-answer
```

The answer element is tracked via MutationObserver when the answer appears in view. The element's text content is used as the answer text.

-   The question value for answer view events is derived from the most recently submitted or clicked question (tracked internally), not from a separate data attribute.

## 

PIA answer feedback _(optional)_

[](#pia-answer-feedback-optional)

Add the following data attributes to feedback buttons (e.g., thumbs up/down) on answers:

```
data-cnstrc-pia-feedback
data-cnstrc-pia-feedback-type="[feedback type]" // optional - see notes below
```

-   `data-cnstrc-pia-feedback` identifies a PIA answer feedback element.
-   `data-cnstrc-pia-feedback-type` specifies the feedback type value (e.g., `"positive"`, `"negative"`). If absent, the feedback type is derived from the element's text content or class.

### 

Example markup

[](#example-markup-7)

```
<!-- PDP container (already exists on PDP pages) -->
<div
  data-cnstrc-product-detail
  data-cnstrc-item-id="RUG-12345"
  data-cnstrc-item-name="Vintage Persian Rug 8x10"
  data-cnstrc-item-variation-id="RUG-12345-BLUE"
>
  <!-- PIA widget -->
  <div data-cnstrc-pia>
    <!-- Suggested questions -->
    <div>
      <button data-cnstrc-pia-question>What materials is this rug made of?</button>
      <button data-cnstrc-pia-question>Is this rug suitable for high-traffic areas?</button>
      <button data-cnstrc-pia-question>How do I clean this rug?</button>
    </div>

    <!-- Input and submit -->
    <div>
      <input
        data-cnstrc-pia-input
        type="text"
        placeholder="Ask a question about this product..."
      />
      <button data-cnstrc-pia-submit-btn>Ask</button>
    </div>

    <!-- Answer area (populated dynamically) -->
    <div>
      <p data-cnstrc-pia-answer>
        This rug is made of 100% hand-knotted wool with a cotton foundation...
      </p>

      <!-- Feedback on the answer -->
      <button data-cnstrc-pia-feedback data-cnstrc-pia-feedback-type="positive">👍</button>
      <button data-cnstrc-pia-feedback data-cnstrc-pia-feedback-type="negative">👎</button>
    </div>
  </div>
</div>
```

# 

Index keys

[](#index-keys)

Constructor's product discovery service requires an index key (also known as an API key) to be defined to route behavioral tracking requests to the correct index.

The index key should be exposed via the browser’s `window` object as shown below:

```
window.cnstrc = window.cnstrc || {};
window.cnstrc.indexKey = 'key_xxxxxxxxxxxxxxxx';
```

Replace the example value with the API key corresponding to the index you wish to send events to. This key may vary depending on regional or language-specific configurations.

The API key is not considered secret and is safe to expose publicly in browser environments. Learn more about this [here](/docs/faq-api-are-the-api-key-and-token-considered-secret).

> ❗️
> 
> ### 
> 
> Warning
> 
> [](#warning)
> 
> The API key is **not** the same as the **API token**. API token is **considered secret and should be treated as sensitive data**. Learn more about the differences between API keys and tokens [here](/docs/integrating-with-constructor-retrieving-results-getting-started#api-key).

# 

User segments

[](#user-segments)

Constructor’s product discovery service can be configured to accept user segments to support segmented rules and analytics. Segments can consist of arbitrary strings that denote a group of users. Common segments include `loggedIn` and `VIP`.

The segments that are exposed in the below window object should be the same segments that are passed for a user's request.

```
window.cnstrc = window.cnstrc || {};
window.cnstrc.userSegments = [ 'loggedIn', 'VIP' ];
```

# 

Logged in user ID

[](#logged-in-user-id)

Constructor’s product discovery service can be configured to accept user IDs to enable omnichannel personalization. With this technique, users who are logged into a website or app will receive consistent personalization across search, browse, recommendations, and other Constructor products as they change between mobile and desktop devices.

To help protect customer end users’ privacy, Constructor strives to minimize its collection of personal information. Therefore, we encourage our customers to obfuscate the user IDs they pass to us so that there’s no way for Constructor to be able to personally identify the users. We also do detection in our tracking beacon to help ensure no personal information is sent in our tracking calls.

For logged in users, the user ID should be exposed in the browser's window object under the `cnstrc` object as indicated below for the Constructor beacon to use for behavioral tracking calls. If the user is not logged in, this value should be omitted.

```
window.cnstrc = window.cnstrc || {};
window.cnstrc.userId = '123XZYZ123';
```

# 

Test cells

[](#test-cells)

When running an A/B test with Constructor, information about the test cell (that is, the experience or experiment) the user is in should be accessible on all pages through the browser's window object. If the user is not part of an active A/B test, this value should not be set.

```
window.cnstrc = window.cnstrc || {};
window.cnstrc.testCell = 'control';
```

When running an A/B test, possible values are:

-   `control`
-   `constructor`

When running an AA/BB test, possible values are:

-   `control_1`
-   `control_2`
-   `constructor_1`
-   `constructor_2`

# 

Deactivate tracking

[](#deactivate-tracking)

In specific situations, it may be desirable to deactivate behavioral tracking requests. One example is when running end-to-end tests or for internal users. This can be achieved this by setting a cookie in the browser with the following details:

-   Name: `ConstructorioDisableBeaconTracking`
-   Value: `true`

When this cookie is present, behavioral tracking will be deactivated for this browser session and no tracking data will be dispatched.

Updated 11 days ago

* * *

Did this page help you?

Leave an optional comment…

Leave an optional comment…

---

## Make us prove it

-   [The Proof Schedule®](/docs/make-us-prove-it-the-proof-schedule)
-   [Beacon](/docs/make-us-prove-it-beacon)
    -   [Load our beacon](/docs/make-us-prove-it-beacon-load-our-beacon)
        -   [Direct site placement](/docs/make-us-prove-it-beacon-load-our-beacon-direct-site-placement)
        -   [Google Tag Manager](/docs/make-us-prove-it-beacon-load-our-beacon-google-tag-manager)
        -   [Tealium iQ](/docs/make-us-prove-it-beacon-load-our-beacon-tealium-iq)
        -   [Adobe Launch](/docs/make-us-prove-it-beacon-load-our-beacon-adobe-launch)
        -   [SFRA Salesforce cartridge](/docs/make-us-prove-it-beacon-load-our-beacon-sfra-salesforce-cartridge)
    -   [Beacon FAQ](/docs/make-us-prove-it-beacon-beacon-faq)
-   [Product catalog](/docs/make-us-prove-it-product-catalog)
    -   [Catalog data concepts](/docs/make-us-prove-it-product-catalog-catalog-data-concepts)
    -   [Using the preferred format](/docs/make-us-prove-it-product-catalog-using-the-preferred-format)
    -   [Using alternative formats](/docs/make-us-prove-it-product-catalog-using-alternative-formats)
    -   [File transfer options](/docs/make-us-prove-it-product-catalog-file-transfer-options)
    -   [Defining group hierarchy](/docs/make-us-prove-it-product-catalog-defining-group-hierarchy)
    -   [Catalog FAQ](/docs/make-us-prove-it-product-catalog-catalog-faq)

---

## Products

-   [AI-powered product discovery](/docs/products-ai-powered-product-discovery)
    -   [KPI optimization](/docs/products-ai-powered-product-discovery-kpi-optimization)
    -   [Results ranking at Constructor](/docs/products-ai-powered-product-discovery-results-ranking-at-constructor)
-   [Search](/docs/products-search-learn-about-search)
    -   [Learn about Search](/docs/products-search-learn-about-search)
    -   [Learn about Image Search](/docs/products-search-learn-about-image-search)
    -   [Learn about Related Search](/docs/products-search-learn-about-related-search)
        -   [Implement Related Search](/docs/products-search-learn-about-related-search-implement-related-search)
    -   [Learn about Related Categories](/docs/products-search-learn-about-related-categories)
        -   [Implement Related Categories](/docs/products-search-learn-about-related-categories-implement-related-categories)
    -   [Get the most out of Search](/docs/products-search-get-the-most-out-of-search)
-   [Browse](/docs/products-browse-learn-about-browse)
    -   [Learn about Browse](/docs/products-browse-learn-about-browse)
    -   [Get the most out of Browse](/docs/products-browse-get-the-most-out-of-browse)
-   [Autocomplete](/docs/products-autocomplete-learn-about-autocomplete)
    -   [Learn about Autocomplete](/docs/products-autocomplete-learn-about-autocomplete)
    -   [Autocomplete examples](/docs/products-autocomplete-autocomplete-examples)
-   [Recommendations](/docs/products-recommendations)
    -   [Learn about Recommendations](/docs/products-recommendations-learn-about-recommendations)
    -   [Get the most out of Recommendations](/docs/products-recommendations-get-the-most-out-of-recommendations)
    -   [Recommendations examples](/docs/products-recommendations-recommendations-examples)
    -   [Recommendations Searchandising](/docs/products-recommendations-recommendations-searchandising)
    -   [Offsite Discovery Recommendations](/docs/products-recommendations-offsite-discovery-recommendations)
-   [Retail Media](/docs/products-retail-media-learn-about-sponsored-listings)
    -   [Learn about Sponsored Listings](/docs/products-retail-media-learn-about-sponsored-listings)
        -   [Implement Sponsored Listings](/docs/products-retail-media-learn-about-sponsored-listings-implement-sponsored-listings)
        -   [Invoicing for Sponsored Listings](/docs/products-retail-media-learn-about-sponsored-listings-invoicing-for-sponsored-listings)
    -   [Learn about the Mediation Layer](/docs/products-retail-media-learn-about-the-mediation-layer)
        -   [Implement the Mediation Layer](/docs/products-retail-media-learn-about-the-mediation-layer-implement-the-mediation-layer)
    -   [Learn about Display Ads](/docs/products-retail-media-learn-about-display-ads)
        -   [Implement Display Ads](/docs/products-retail-media-learn-about-display-ads-implement-display-ads)
-   [AI Shopping Agents](/docs/products-ai-shopping-agents-learn-about-ai-shopping-agent)
    -   [Learn about AI Shopping Agent](/docs/products-ai-shopping-agents-learn-about-ai-shopping-agent)
        -   [Implement AI Shopping Agent](/docs/products-ai-shopping-agents-learn-about-ai-shopping-agent-implement-ai-shopping-agent)
    -   [Learn about Product Insights Agent](/docs/products-ai-shopping-agents-learn-about-product-insights-agent)
        -   [Implement Product Insights Agent](/docs/products-ai-shopping-agents-learn-about-product-insights-agent-implement-product-insights-agent)
-   [Cross-Channel & Offsite Discovery](/docs/products-cross-channel-offsite-discovery)
    -   [Learn about Email Recommendations](/docs/products-cross-channel-offsite-discovery-learn-about-email-recommendations)
        -   [Implement Email Recommendations](/docs/products-cross-channel-offsite-discovery-learn-about-email-recommendations-implement-email-recommendations)
-   [Merchant Intelligence](/docs/products-merchant-intelligence-learn-about-merchant-intelligence)
    -   [Learn about Merchant Intelligence](/docs/products-merchant-intelligence-learn-about-merchant-intelligence)
    -   [Get the most out of Merchant Intelligence](/docs/products-merchant-intelligence-get-the-most-out-of-merchant-intelligence)
-   [Collections](/docs/products-collections)
    -   [Learn about Collections](/docs/products-collections-learn-about-collections)
    -   [Get the most out of Collections](/docs/products-collections-get-the-most-out-of-collections)
    -   [Managing Collections via dashboard](/docs/products-collections-managing-collections-via-dashboard)
-   [Quizzes](/docs/products-quizzes-implement-quizzes)
    -   [Implement Quizzes](/docs/products-quizzes-implement-quizzes)
-   [Attribute Enrichment](/docs/products-attribute-enrichment-learn-about-attribute-enrichment)
    -   [Learn about Attribute Enrichment](/docs/products-attribute-enrichment-learn-about-attribute-enrichment)
    -   [Learn about badges](/docs/products-attribute-enrichment-learn-about-badges)
        -   [Implement badges](/docs/products-attribute-enrichment-learn-about-badges-implement-badges)