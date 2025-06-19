import $ from 'jquery'

export const helper = {
  getImageUrl(name) {
    return new URL(`../../assets/${name}`, import.meta.url).href
  },
  TreeViewHeight(){
      const treeviewCard = document.querySelector('.treeview-card');
      const footer = document.querySelector('.v-footer');

      if (treeviewCard && footer) {
        const resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            const footerHeight = $(footer).outerHeight(true) - 23;
            const newHeight = entry.contentRect.height - footerHeight;
            $('.v-treeview').height(newHeight);
          }
        });

        resizeObserver.observe(treeviewCard);
      }
    },
}
