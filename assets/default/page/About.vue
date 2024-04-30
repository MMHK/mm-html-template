<template>
  <main class="page-about">
    <section class="section">
      <div class="block">
        <form method="get">
          <b-field>
            <b-input name="s" placeholder="Search..." v-model="searchText" type="search"></b-input>
            <p class="control">
              <b-button native-type="submit" class="button is-primary">Search</b-button>
              <b-button v-if="searchText.length > 0" class="button" @click="handleClear">Clear</b-button>
            </p>
          </b-field>
        </form>
      </div>

      <div class="block">
        <b-table :data="mails"
                 :striped="true"
                 :hoverable="true"
                 :per-page="pageSize"
                 :pagination-simple="false"
                 :loading="loading"
                 :total="total"
                 :pagination-rounded="false"
                 :pagination-order="`is-centered`"
                 paginated
                 backend-pagination
                 aria-next-label="Next page"
                 aria-previous-label="Previous page"
                 @page-change="onPageChange"
                 :current-page="currentPage">
          <template #cell(subject)="row">
            <div class="block">
              {{ row.value }}
            </div>
          </template>

          <b-table-column label="ID" v-slot="props">{{props.row.id}}</b-table-column>
          <b-table-column label="Subject" v-slot="props" width="300">
            <div class="block is-align-content-center">
              <a @click="callPreview(props.row.id)" class="subtitle link"> {{ props.row.subject }} </a>
            </div>
          </b-table-column>
          <b-table-column label="From" v-slot="props">{{props.row.from}}</b-table-column>
          <b-table-column label="To" v-slot="props">{{props.row.to}}</b-table-column>
          <b-table-column label="Date" v-slot="props">{{props.row.date}}</b-table-column>
          <b-table-column label="Create Time" v-slot="props">{{props.row.created_at}}</b-table-column>

          <template #empty>
            <div class="has-text-centered">No records</div>
          </template>
        </b-table>
      </div>

      <b-modal
          v-model="showPreview"
          has-modal-card
          aria-role="dialog"
          aria-label="Email Preview"
          close-button-aria-label="Close"
          aria-modal
          :width="750"
          scroll="keep">
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="subtitle">{{ preview?.subject || "Not found" }}</p>
          </header>
          <section>
            <p class="modal-card-body"><strong>From: </strong> {{preview.from}} <br> <strong>To: </strong>{{preview.to}}</p>
          </section>
          <section class="modal-card-body">
            <div class="card">
              <div class="card-content">
                <div class="content" v-html="preview.content || ``">
                </div>
              </div>
            </div>
          </section>
          <section class="modal-card-body" v-if="preview.attachments && preview.attachments.length > 0">
            <h2 class="subtitle">Attachments:</h2>
            <ul class="columns">
              <li class="column" v-for="attachment in preview.attachments"><a
                  :href="attachmentURL(attachment.id)" target="_blank"
                  class="button is-primary">{{attachment.name}}</a></li>
            </ul>
          </section>
          <footer class="modal-card-foot is-justify-content-flex-end">
            <b-button label="Close" @click="previewClose()" />
          </footer>
        </div>
      </b-modal>

    </section>
  </main>
</template>

<script setup>
import {onMounted, ref} from "vue";

const preview = ref({
  subject: '',
})
const showPreview = ref(false);
const searchText = ref('');
const handleClear = () => {
  searchText.value = '';
}
const pageSize = ref(10);
const currentPage = ref(1);
const total = ref(0);
const loading = ref(false);
const mails = ref([]);

const fetchData = async () => {
  loading.value = true;
  mails.value = Array.from(new Array(50)).map((_, i) => {
    return {
      id: i + 1,
      subject: 'Test',
      from: 'test@test.com',
      to: 'test@test.com',
      date: '2021-01-01',
      created_at: '2021-01-01',
    }
  });

  pageSize.value = 10;
  currentPage.value = currentPage.value + 1;
  total.value = 50;
  setTimeout(() => {
    loading.value = false;
  }, 2000);
}

const callPreview = (id) => {
  showPreview.value = true;
  preview.value = mails.value.find((row) => {
    return row.id === id;
  })
}

const previewClose = () => {
  showPreview.value = false;
}

onMounted(() => {
  fetchData();
})
</script>

<script>
import { defineComponent} from 'vue';
import {BTable, BTableColumn} from "buefy/src/components/table"
import {BField} from "buefy/src/components/field"
import {BInput} from "buefy/src/components/input"
import {BButton} from "buefy/src/components/button"
import {BModal} from "buefy/src/components/modal"
export default defineComponent({
  name: "About",

  components: {
    BField,
    BTable,
    BInput,
    BButton,
    BTableColumn,
    BModal,
  },
});
</script>

<style lang="scss">
.page-about {
  width: 100%;
  background: rgba(255, 255, 255, 0.9);

  .preview.container {
    min-width: 500px;
    background: white;
  }
}
</style>
